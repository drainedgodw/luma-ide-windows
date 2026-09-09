import { access, readdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { StackToolAction, StackToolDefinition } from '../shared/stackCatalog';

export async function prepareBaseStackManifest(repo: string, action: StackToolAction, definition: StackToolDefinition): Promise<string | null> {
  if (definition.extendedManager) return null;
  switch (definition.manager) {
    case 'cargo': return ensureCargoManifest(repo, action);
    case 'go': return ensureGoManifest(repo, action);
    case 'dotnet': return ensureDotnetManifest(repo, action);
    case 'node': case 'pip': return null;
  }
}
export async function ensureCargoManifest(repo: string, action: StackToolAction): Promise<string | null> {
  const path = join(repo, 'Cargo.toml');
  if (await fileExists(path)) return null;
  if (action === 'uninstall') throw new Error('No Cargo.toml exists, so there is nothing to remove');
  await writeFile(path, `[package]\nname = "${projectName(repo)}"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n`, { encoding: 'utf8', flag: 'wx' });
  return 'Created a minimal Cargo.toml.';
}
export async function ensureGoManifest(repo: string, action: StackToolAction): Promise<string | null> {
  const path = join(repo, 'go.mod');
  if (await fileExists(path)) return null;
  if (action === 'uninstall') throw new Error('No go.mod exists, so there is nothing to remove');
  await writeFile(path, `module luma.local/${projectName(repo)}\n\ngo 1.22\n`, { encoding: 'utf8', flag: 'wx' });
  return 'Created a minimal go.mod.';
}
export async function ensureDotnetManifest(repo: string, action: StackToolAction, webProject = false): Promise<string | null> {
  const existing = await dotnetProjects(repo);
  if (existing.length === 1) return null;
  if (existing.length > 1) throw new Error('Open a folder containing one .csproj file so Luma can choose safely');
  if (action === 'uninstall') throw new Error('No .csproj exists, so there is nothing to remove');
  const name = pascalProjectName(repo);
  const source = `<Project Sdk="${webProject ? 'Microsoft.NET.Sdk.Web' : 'Microsoft.NET.Sdk'}">\n  <PropertyGroup>\n    <OutputType>Exe</OutputType>\n    <TargetFramework>net8.0</TargetFramework>\n    <ImplicitUsings>enable</ImplicitUsings>\n    <Nullable>enable</Nullable>\n  </PropertyGroup>\n</Project>\n`;
  await writeFile(join(repo, `${name}.csproj`), source, { encoding: 'utf8', flag: 'wx' });
  return `Created a minimal ${name}.csproj.`;
}
export async function singleDotnetProject(repo: string): Promise<string> {
  const projects = await dotnetProjects(repo);
  if (projects.length === 0) throw new Error('No .csproj project exists');
  if (projects.length > 1) throw new Error('Open a folder containing one .csproj file so Luma can choose safely');
  return projects[0];
}
async function dotnetProjects(repo: string): Promise<string[]> {
  return (await readdir(repo).catch(() => [] as string[])).filter((file) => file.endsWith('.csproj'));
}
function projectName(repo: string): string {
  const value = basename(repo).normalize('NFKD').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^[-_]+|[-_]+$/g, '').slice(0, 64);
  return value || 'luma-project';
}
function pascalProjectName(repo: string): string {
  const words = basename(repo).normalize('NFKD').match(/[A-Za-z0-9]+/g) ?? [];
  const value = words.map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`).join('').replace(/^[0-9]/, 'Project$&').slice(0, 80);
  return value || 'LumaProject';
}
async function fileExists(path: string): Promise<boolean> { return access(path).then(() => true, () => false); }
