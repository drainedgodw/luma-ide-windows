import { describe, expect, it } from 'vitest';
import { windowsDownloadPage } from '../src/main/platform/windowsUpdate';

describe('Windows update download page', () => {
  it('resolves the stable release page', () => {
    expect(windowsDownloadPage('release')).toBe(
      'https://github.com/drainedgodw/luma-ide-windows/releases/latest'
    );
  });

  it('resolves the releases list for nightly builds', () => {
    expect(windowsDownloadPage('nightly')).toBe(
      'https://github.com/drainedgodw/luma-ide-windows/releases'
    );
  });

  it('rejects unsupported channels', () => {
    expect(windowsDownloadPage('preview')).toBeNull();
  });
});
