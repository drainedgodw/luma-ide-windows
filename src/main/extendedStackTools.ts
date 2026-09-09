import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { ensureDotnetManifest, singleDotnetProject } from './stackManifestPreparation';
import { STACK_TOOL_CATALOG, isStackToolSupported, type ExtendedStackToolManager, type StackToolAction, type StackToolDefinition, type StackToolPlatform, type StackToolResult } from '../shared/stackCatalog';
interface ProcessResult { code: number; output: string }
export interface ExtendedStackCommand { command: string; args: string[]; display: string }
const EXTENDED_MANAGERS = new Set<ExtendedStackToolManager>(['maven', 'vcpkg', 'winget', 'dotnet-package', 'dotnet-workload']);
const activeActions = new Set<string>();
export function isExtendedStackTool(definition: StackToolDefinition): boolean {
  return definition.extendedManager !== undefined && EXTENDED_MANAGERS.has(definition.extendedManager);
}
export function buildExtendedStackCommands(definition: StackToolDefinition, action: StackToolAction, platform: StackToolPlatform, projectFile?: string): ExtendedStackCommand[] {
  if (!isStackToolSupported(definition, platform)) throw new Error('This Stack action is not available on the current operating system');
  if (definition.extendedManager === 'winget') {
    if (platform !== 'win32') throw new Error('This installer requires Windows Package Manager');
    const verb = action === 'install' ? 'install' : 'uninstall';
    const args = [verb, '--id', definition.packages[0], '--exact', '--source', 'winget'];
    if (action === 'install') args.push('--accept-package-agreements', '--accept-source-agreements');
    args.push('--disable-interactivity');
    return [{ command: 'winget.exe', args, display: formatCommand('winget', args) }];
  }
  if (definition.extendedManager === 'dotnet-package') {
    if (!projectFile) throw new Error('A .csproj project is required');
    const args = [action === 'install' ? 'add' : 'remove', projectFile, 'package', ...definition.packages];
    if (action === 'install' && definition.version) args.push('--version', definition.version);
    return [{ command: 'dotnet', args, display: formatCommand('dotnet', args) }];
  }
  if (definition.extendedManager === 'dotnet-workload') {
    const args = ['workload', action === 'install' ? 'install' : 'uninstall', ...definition.packages];
    return [{ command: 'dotnet', args, display: formatCommand('dotnet', args) }];
  }
  return [];
}
export async function runExtendedStackToolAction(repo: string, action: StackToolAction, name: string, definition: StackToolDefinition, platform: StackToolPlatform): Promise<StackToolResult> {
  if (!isExtendedStackTool(definition)) throw new Error(`Unsupported extended Stack manager: ${definition.extendedManager ?? 'none'}`);
  if (!isStackToolSupported(definition, platform)) throw new Error(`${name} does not have a safe one-click installer for this operating system`);
  const operationKey = `${repo}\u0000${definition.extendedManager}`;
  if (activeActions.has(operationKey)) throw new Error(`Another ${definition.extendedManager} Stack action is already running`);
  activeActions.add(operationKey);
  try {
    if (definition.extendedManager === 'maven') return mutateMavenManifest(repo, action, name, definition);
    if (definition.extendedManager === 'vcpkg') return mutateVcpkgManifest(repo, action, name, definition);
    let projectFile: string | undefined, output = '';
    if (definition.extendedManager === 'dotnet-package') {
      const created = await ensureDotnetManifest(repo, action, name === 'ASP.NET Core' || name === 'Blazor');
      projectFile = await singleDotnetProject(repo);
      if (created) output += `${created}\n`;
    }
    const commands = buildExtendedStackCommands(definition, action, platform, projectFile);
    for (const command of commands) {
      const result = await runProcess(repo, command);
      output += `$ ${command.display}\n${result.output.trim()}\n`;
      if (result.code !== 0) return { ok: false, action, command: commands.map((item) => item.display).join('\n'), output: output.trim().slice(-12000) };
    }
    return { ok: true, action, command: commands.map((item) => item.display).join('\n'), output: output.trim().slice(-12000) };
  } finally { activeActions.delete(operationKey); }
}
export async function extendedDetectedPackages(repo: string, platform: StackToolPlatform): Promise<Record<string, string[]>> {
  const detected: Record<string, string[]> = { java: [], cpp: [], csharp: [] };
  const pom = await readText(join(repo, 'pom.xml'));
  if (pom) detected.java = mavenCoordinates(pom);
  const vcpkg = await readText(join(repo, 'vcpkg.json'));
  if (vcpkg) { try { detected.cpp = vcpkgDependencyNames(JSON.parse(vcpkg)); } catch {} }
  const workloads = await probe(repo, { command: 'dotnet', args: ['workload', 'list'], display: 'dotnet workload list' });
  if (workloads.code === 0 && /(^|\s)maui(\s|$)/im.test(workloads.output)) detected.csharp.push('maui');
  if (platform === 'win32') {
    const external = Object.entries(STACK_TOOL_CATALOG).flatMap(([packId, tools]) => Object.values(tools).filter((definition) => definition.extendedManager === 'winget').map((definition) => ({ packId, definition })));
    for (const { packId, definition } of external) {
      const packageId = definition.packages[0];
      const result = await probe(repo, { command: 'winget.exe', args: ['list', '--id', packageId, '--exact', '--source', 'winget', '--disable-interactivity'], display: `winget list --id ${packageId}` });
      if (result.code === 0 && result.output.toLowerCase().includes(packageId.toLowerCase())) (detected[packId] ??= []).push(packageId);
    }
  }
  return detected;
}
async function mutateMavenManifest(repo: string, action: StackToolAction, name: string, definition: StackToolDefinition): Promise<StackToolResult> {
  const path = join(repo, 'pom.xml'); let source = await readText(path), created = false;
  if (!source) { if (action === 'uninstall') throw new Error('No pom.xml exists, so there is nothing to remove'); source = createPom(repo); created = true; }
  if (!source.includes('</project>')) throw new Error('pom.xml is not a complete Maven project');
  const changed: string[] = [];
  for (const coordinate of definition.packages) {
    const parsed = parseCoordinate(coordinate), present = hasMavenDependency(source, parsed.groupId, parsed.artifactId);
    if (action === 'install' && !present) { source = addMavenDependency(source, parsed, definition.development); changed.push(coordinate); }
    else if (action === 'uninstall' && present) { source = removeMavenDependency(source, parsed.groupId, parsed.artifactId); changed.push(coordinate); }
  }
  if (action === 'install' && definition.repository) source = ensureMavenRepository(source, definition.repository);
  if (changed.length === 0 && action === 'uninstall') throw new Error(`${name} is not present in pom.xml`);
  await writeFile(path, source.endsWith('\n') ? source : `${source}\n`, 'utf8');
  const verb = action === 'install' ? 'add' : 'remove';
  return { ok: true, action, command: `pom.xml ${verb} ${definition.packages.join(' ')}`, output: `${created ? 'Created a minimal pom.xml. ' : ''}${action === 'install' ? 'Added' : 'Removed'} ${name} ${action === 'install' ? 'to' : 'from'} Maven dependencies. Maven will resolve the manifest on the next build.` };
}
async function mutateVcpkgManifest(repo: string, action: StackToolAction, name: string, definition: StackToolDefinition): Promise<StackToolResult> {
  const path = join(repo, 'vcpkg.json'), current = await readText(path); let manifest: Record<string, unknown>, created = false;
  if (!current) { if (action === 'uninstall') throw new Error('No vcpkg.json exists, so there is nothing to remove'); manifest = { name: projectName(repo), 'version-string': '0.1.0', dependencies: [] }; created = true; }
  else { try { manifest = JSON.parse(current) as Record<string, unknown>; } catch { throw new Error('vcpkg.json contains invalid JSON; Luma will not overwrite it'); } }
  const dependencies = Array.isArray(manifest.dependencies) ? [...manifest.dependencies] : [], names = new Set(dependencies.map(vcpkgDependencyName).filter(Boolean));
  if (action === 'install') for (const dependency of definition.packages) { if (!names.has(dependency)) dependencies.push(dependency); }
  else { const wanted = new Set(definition.packages), filtered = dependencies.filter((item) => !wanted.has(vcpkgDependencyName(item))); if (filtered.length === dependencies.length) throw new Error(`${name} is not present in vcpkg.json`); dependencies.splice(0, dependencies.length, ...filtered); }
  manifest.dependencies = dependencies; await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return { ok: true, action, command: `vcpkg ${action === 'install' ? 'add port' : 'remove port'} ${definition.packages.join(' ')}`, output: `${created ? 'Created vcpkg.json. ' : ''}${action === 'install' ? 'Added' : 'Removed'} ${name} ${action === 'install' ? 'to' : 'from'} the vcpkg manifest. Dependencies will resolve during the next vcpkg/CMake configure.` };
}
function createPom(repo: string): string { return `<?xml version="1.0" encoding="UTF-8"?>\n<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">\n  <modelVersion>4.0.0</modelVersion>\n  <groupId>dev.luma</groupId>\n  <artifactId>${escapeXml(projectName(repo))}</artifactId>\n  <version>0.1.0</version>\n  <properties>\n    <maven.compiler.release>21</maven.compiler.release>\n    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>\n  </properties>\n  <dependencies>\n  </dependencies>\n</project>\n`; }
function addMavenDependency(source: string, coordinate: { groupId: string; artifactId: string; version: string }, development = false): string {
  const block = `    <dependency>\n      <groupId>${escapeXml(coordinate.groupId)}</groupId>\n      <artifactId>${escapeXml(coordinate.artifactId)}</artifactId>\n      <version>${escapeXml(coordinate.version)}</version>${development ? '\n      <scope>test</scope>' : ''}\n    </dependency>`;
  if (/<dependencies\b[^>]*>[\s\S]*?<\/dependencies>/m.test(source)) return source.replace(/(\s*)<\/dependencies>/m, `\n${block}$1</dependencies>`);
  return source.replace(/\s*<\/project>/, `\n  <dependencies>\n${block}\n  </dependencies>\n</project>`);
}
function removeMavenDependency(source: string, groupId: string, artifactId: string): string { return source.replace(/\s*<dependency\b[^>]*>[\s\S]*?<\/dependency>/g, (block) => { const group = block.match(/<groupId>\s*([^<]+)\s*<\/groupId>/)?.[1]?.trim(), artifact = block.match(/<artifactId>\s*([^<]+)\s*<\/artifactId>/)?.[1]?.trim(); return group === groupId && artifact === artifactId ? '' : block; }); }
function ensureMavenRepository(source: string, url: string): string { if (source.includes(`<url>${url}</url>`)) return source; const repository = `    <repository>\n      <id>luma-${projectName(url)}</id>\n      <url>${escapeXml(url)}</url>\n    </repository>`; if (/<repositories\b[^>]*>[\s\S]*?<\/repositories>/m.test(source)) return source.replace(/(\s*)<\/repositories>/m, `\n${repository}$1</repositories>`); return source.replace(/\s*<\/project>/, `\n  <repositories>\n${repository}\n  </repositories>\n</project>`); }
function mavenCoordinates(source: string): string[] { return [...source.matchAll(/<dependency\b[^>]*>([\s\S]*?)<\/dependency>/g)].flatMap((match) => { const group = match[1].match(/<groupId>\s*([^<]+)\s*<\/groupId>/)?.[1]?.trim(), artifact = match[1].match(/<artifactId>\s*([^<]+)\s*<\/artifactId>/)?.[1]?.trim(); return group && artifact ? [`${group}:${artifact}`] : []; }); }
function hasMavenDependency(source: string, groupId: string, artifactId: string): boolean { return mavenCoordinates(source).includes(`${groupId}:${artifactId}`); }
function parseCoordinate(value: string): { groupId: string; artifactId: string; version: string } { const [groupId, artifactId, ...versionParts] = value.split(':'), version = versionParts.join(':'); if (!groupId || !artifactId || !version) throw new Error(`Invalid Maven coordinate: ${value}`); return { groupId, artifactId, version }; }
function vcpkgDependencyNames(manifest: unknown): string[] { if (!manifest || typeof manifest !== 'object') return []; const dependencies = (manifest as { dependencies?: unknown }).dependencies; return Array.isArray(dependencies) ? dependencies.map(vcpkgDependencyName).filter((name): name is string => Boolean(name)) : []; }
function vcpkgDependencyName(value: unknown): string { if (typeof value === 'string') return value; if (value && typeof value === 'object' && typeof (value as { name?: unknown }).name === 'string') return (value as { name: string }).name; return ''; }
function projectName(value: string): string { const name = basename(value).normalize('NFKD').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 63); return name || 'luma-project'; }
async function probe(cwd: string, command: ExtendedStackCommand): Promise<ProcessResult> { return runProcess(cwd, command, 10_000); }
function runProcess(cwd: string, command: ExtendedStackCommand, timeoutMs = 30 * 60_000): Promise<ProcessResult> { return new Promise((resolve) => { let settled = false, output = ''; const finish = (result: ProcessResult) => { if (settled) return; settled = true; clearTimeout(timer); resolve(result); }; const append = (chunk: unknown) => { output = `${output}${String(chunk)}`.slice(-50_000); }; const child = spawn(command.command, command.args, { cwd, env: { ...process.env, CI: '1', NO_COLOR: '1' }, shell: false, windowsHide: true }); const timer = setTimeout(() => { child.kill(); finish({ code: -1, output: `${output}\nTimed out after ${Math.round(timeoutMs / 1000)}s` }); }, timeoutMs); child.stdout.on('data', append); child.stderr.on('data', append); child.once('error', (error: Error) => finish({ code: -1, output: `${output}\n${error.message}` })); child.once('close', (code: number | null) => finish({ code: code ?? -1, output })); }); }
async function readText(path: string): Promise<string | null> { return readFile(path, 'utf8').catch(() => null); }
function escapeXml(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;'); }
function formatCommand(command: string, args: string[]): string { return [command, ...args].map(quoteArgument).join(' '); }
function quoteArgument(value: string): string { return /^[A-Za-z0-9_./:@+-]+$/.test(value) ? value : JSON.stringify(value); }
