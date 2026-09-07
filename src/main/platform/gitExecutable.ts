import { existsSync } from 'node:fs';
import { win32 } from 'node:path';

export interface GitExecutableOptions {
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  resourcesPath?: string;
  fileExists?: (path: string) => boolean;
}

export function resolveGitExecutable(options: GitExecutableOptions = {}): string {
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;
  const override = env.LUMA_GIT?.trim();
  if (override) return override;

  const runtimeResources =
    options.resourcesPath ??
    (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;

  if (platform === 'win32' && runtimeResources) {
    const bundledGit = win32.join(runtimeResources, 'git', 'cmd', 'git.exe');
    const fileExists = options.fileExists ?? existsSync;
    if (fileExists(bundledGit)) return bundledGit;
  }

  return 'git';
}

export function createGitEnvironment(
  executable: string,
  baseEnv: NodeJS.ProcessEnv = process.env,
  extraEnv: Record<string, string> = {}
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...baseEnv,
    GIT_OPTIONAL_LOCKS: '0',
    LC_ALL: 'C',
    ...extraEnv,
  };

  if (win32.isAbsolute(executable)) {
    const executableDirectory = win32.dirname(executable);
    const currentPath = env.Path ?? env.PATH ?? '';
    const bundledPath = currentPath
      ? `${executableDirectory};${currentPath}`
      : executableDirectory;
    env.Path = bundledPath;
    env.PATH = bundledPath;
  }

  return env;
}
