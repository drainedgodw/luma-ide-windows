import { app, ipcMain, shell } from 'electron';
import { windowsDownloadPage } from './platform/windowsUpdate';

const VERSION_URL =
  'https://raw.githubusercontent.com/drainedgodw/luma-ide-windows/main/update.json';

function newerThan(latest: string, current: string): boolean {
  const a = latest.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return false;
}

async function latestVersion(): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(VERSION_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`update check: HTTP ${response.status}`);
    const data = (await response.json()) as { version?: string };
    if (!data.version) throw new Error('update check: no version field');
    return data.version;
  } finally {
    clearTimeout(timer);
  }
}

export function registerUpdateIpc(): void {
  ipcMain.handle('update:check', async () => {
    try {
      const current = app.getVersion();
      const latest = await latestVersion();
      return { ok: true, data: { current, latest, update: newerThan(latest, current) } };
    } catch (error) {
      return { ok: false, error: { message: (error as Error).message, stderr: '' } };
    }
  });
  ipcMain.handle('update:run', async (_event, channel: string) => {
    const downloadPage = windowsDownloadPage(channel);
    if (!downloadPage) {
      return { ok: false, error: { message: 'Unknown update channel', stderr: '' } };
    }
    try {
      await shell.openExternal(downloadPage);
      return { ok: true, data: 'download-page-opened' };
    } catch (error) {
      return { ok: false, error: { message: (error as Error).message, stderr: '' } };
    }
  });
}
