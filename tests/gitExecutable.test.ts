import { describe, expect, it } from 'vitest';
import { createGitEnvironment, resolveGitExecutable } from '../src/main/platform/gitExecutable';

const bundledGit = 'C:\\Program Files\\Luma\\resources\\git\\cmd\\git.exe';

describe('Git executable resolution', () => {
  it('uses an explicit LUMA_GIT override first', () => {
    expect(
      resolveGitExecutable({
        platform: 'win32',
        env: { LUMA_GIT: 'D:\\Tools\\Git\\cmd\\git.exe' },
        resourcesPath: 'C:\\Program Files\\Luma\\resources',
        fileExists: () => true,
      })
    ).toBe('D:\\Tools\\Git\\cmd\\git.exe');
  });

  it('uses the bundled MinGit executable in a packaged Windows app', () => {
    expect(
      resolveGitExecutable({
        platform: 'win32',
        env: {},
        resourcesPath: 'C:\\Program Files\\Luma\\resources',
        fileExists: (path) => path === bundledGit,
      })
    ).toBe(bundledGit);
  });

  it('falls back to the system PATH during development', () => {
    expect(
      resolveGitExecutable({
        platform: 'win32',
        env: {},
        resourcesPath: 'C:\\dev\\electron\\resources',
        fileExists: () => false,
      })
    ).toBe('git');
  });

  it('keeps the system Git fallback on non-Windows platforms', () => {
    expect(
      resolveGitExecutable({
        platform: 'linux',
        env: {},
        resourcesPath: '/opt/luma/resources',
        fileExists: () => true,
      })
    ).toBe('git');
  });

  it('adds bundled Git to PATH for helpers and rebase subprocesses', () => {
    expect(
      createGitEnvironment(bundledGit, { Path: 'C:\\Windows\\System32' }, { GIT_EDITOR: 'true' })
    ).toMatchObject({
      Path: 'C:\\Program Files\\Luma\\resources\\git\\cmd;C:\\Windows\\System32',
      PATH: 'C:\\Program Files\\Luma\\resources\\git\\cmd;C:\\Windows\\System32',
      GIT_OPTIONAL_LOCKS: '0',
      LC_ALL: 'C',
      GIT_EDITOR: 'true',
    });
  });
});
