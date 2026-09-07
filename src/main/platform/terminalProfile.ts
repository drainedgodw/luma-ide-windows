import { win32 } from 'node:path';

export interface TerminalProfile {
  file: string;
  args: string[];
}

export function resolveTerminalProfile(
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv = process.env
): TerminalProfile {
  const override = env.LUMA_SHELL?.trim();
  if (override) {
    return {
      file: override,
      args: platform === 'win32' ? windowsShellArgs(override) : ['--login'],
    };
  }

  if (platform === 'win32') {
    const windowsRoot = env.SystemRoot?.trim() || env.WINDIR?.trim();
    const file = windowsRoot
      ? win32.join(
          windowsRoot,
          'System32',
          'WindowsPowerShell',
          'v1.0',
          'powershell.exe'
        )
      : 'powershell.exe';
    return { file, args: ['-NoLogo'] };
  }

  return {
    file: env.SHELL?.trim() || 'bash',
    args: ['--login'],
  };
}

function windowsShellArgs(file: string): string[] {
  const executable = win32.basename(file).toLowerCase();
  return executable === 'powershell.exe' || executable === 'pwsh.exe' ? ['-NoLogo'] : [];
}
