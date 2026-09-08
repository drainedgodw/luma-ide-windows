import { access } from 'node:fs/promises';
import { win32 } from 'node:path';

export interface BundledNodeRuntime {
  nodeExecutable: string;
  npmCli: string;
}

export function bundledNodePaths(
  resourcesPath: string,
  platform: NodeJS.Platform = process.platform
): BundledNodeRuntime | null {
  if (platform !== 'win32' || !resourcesPath.trim()) return null;
  const root = win32.join(resourcesPath, 'node');
  return {
    nodeExecutable: win32.join(root, 'node.exe'),
    npmCli: win32.join(root, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  };
}

export async function findBundledNodeRuntime(
  resourcesPath = ((process as NodeJS.Process & { resourcesPath?: string }).resourcesPath ?? ''),
  platform: NodeJS.Platform = process.platform
): Promise<BundledNodeRuntime | null> {
  const paths = bundledNodePaths(resourcesPath, platform);
  if (!paths) return null;
  const available = await Promise.all([
    access(paths.nodeExecutable).then(() => true).catch(() => false),
    access(paths.npmCli).then(() => true).catch(() => false),
  ]);
  return available.every(Boolean) ? paths : null;
}
