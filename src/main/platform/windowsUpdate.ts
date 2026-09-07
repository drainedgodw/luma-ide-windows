const RELEASES_URL = 'https://github.com/drainedgodw/luma-ide-windows/releases';

export function windowsDownloadPage(channel: string): string | null {
  if (channel === 'release') return `${RELEASES_URL}/latest`;
  if (channel === 'nightly') return RELEASES_URL;
  return null;
}
