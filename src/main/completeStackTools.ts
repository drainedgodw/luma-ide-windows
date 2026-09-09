import { STACK_TOOL_CATALOG, isStackToolInstalled, isStackToolSupported, stackToolDefinition, stackToolKey, type StackToolAction, type StackToolPlatform, type StackToolResult } from '../shared/stackCatalog';
import { extendedDetectedPackages, isExtendedStackTool, runExtendedStackToolAction } from './extendedStackTools';
import { prepareBaseStackManifest } from './stackManifestPreparation';
import { runStackToolAction, stackToolStatus } from './stackTools';
export async function completeStackToolStatus(repo: string, platform: StackToolPlatform = currentPlatform()): Promise<Record<string, boolean>> {
  const status = await stackToolStatus(repo, platform), detected = await extendedDetectedPackages(repo, platform);
  for (const [packId, tools] of Object.entries(STACK_TOOL_CATALOG)) for (const [name, definition] of Object.entries(tools)) {
    if (!isExtendedStackTool(definition) || definition.extendedManager === 'dotnet-package') continue;
    status[stackToolKey(packId, name)] = isStackToolInstalled(definition, detected[packId] ?? []);
  }
  return status;
}
export async function runCompleteStackToolAction(repo: string, action: StackToolAction, packId: string, name: string, platform: StackToolPlatform = currentPlatform()): Promise<StackToolResult> {
  const definition = stackToolDefinition(packId, name);
  if (!definition) throw new Error(`“${name}” is not an approved Stack package for ${packId}`);
  if (!isStackToolSupported(definition, platform)) throw new Error(`${name} does not have a safe one-click installer for this operating system`);
  if (isExtendedStackTool(definition)) return runExtendedStackToolAction(repo, action, name, definition, platform);
  const preparation = await prepareBaseStackManifest(repo, action, definition), result = await runStackToolAction(repo, action, packId, name, platform);
  if (preparation) result.output = `${preparation}\n${result.output}`.trim();
  return result;
}
function currentPlatform(): StackToolPlatform { if (process.platform === 'win32') return 'win32'; if (process.platform === 'darwin') return 'darwin'; return 'linux'; }
