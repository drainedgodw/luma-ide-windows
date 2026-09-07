import { describe, expect, it } from 'vitest';
import { resolveTerminalProfile } from '../src/main/platform/terminalProfile';

describe('terminal profile', () => {
  it('resolves the built-in Windows PowerShell path', () => {
    expect(resolveTerminalProfile('win32', { SystemRoot: 'C:\\Windows' })).toEqual({
      file: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      args: ['-NoLogo'],
    });
  });

  it('falls back to a PATH lookup for PowerShell', () => {
    expect(resolveTerminalProfile('win32', {})).toEqual({
      file: 'powershell.exe',
      args: ['-NoLogo'],
    });
  });

  it('supports an explicit PowerShell 7 override', () => {
    expect(
      resolveTerminalProfile('win32', {
        LUMA_SHELL: 'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
      })
    ).toEqual({
      file: 'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
      args: ['-NoLogo'],
    });
  });

  it('does not pass PowerShell flags to cmd overrides', () => {
    expect(resolveTerminalProfile('win32', { LUMA_SHELL: 'cmd.exe' })).toEqual({
      file: 'cmd.exe',
      args: [],
    });
  });

  it('keeps POSIX login-shell behavior', () => {
    expect(resolveTerminalProfile('linux', { SHELL: '/bin/zsh' })).toEqual({
      file: '/bin/zsh',
      args: ['--login'],
    });
  });
});
