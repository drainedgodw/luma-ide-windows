import { ipcMain, type BrowserWindow } from 'electron';
import { spawn as ptySpawn } from 'node-pty';
import { trustStatus } from './intelligence';
import { resolveTerminalProfile } from './platform/terminalProfile';

const sessions = new Map<string, { pty: ReturnType<typeof ptySpawn>; workspace: string }>();

function terminalEnvironment(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  env.TERM = 'xterm-256color';
  env.COLORTERM = 'truecolor';
  return env;
}

export function registerTerminal(
  getWindow: () => BrowserWindow | null,
  getWorkspace: () => string | null
) {
  ipcMain.on('term:create', (_event, id: string) => {
    void (async () => {
      const workspace = getWorkspace();
      if (!workspace || !(await trustStatus(workspace))) {
        getWindow()?.webContents.send(
          `term:data:${id}`,
          '\r\n\x1b[33m[Luma] Terminal is disabled until this workspace is trusted. Open Workspace Tools → Trust workspace.\x1b[0m\r\n'
        );
        getWindow()?.webContents.send(`term:exit:${id}`, 126);
        return;
      }

      const profile = resolveTerminalProfile(process.platform);
      try {
        const pty = ptySpawn(profile.file, profile.args, {
          name: 'xterm-256color',
          cols: 80,
          rows: 24,
          cwd: workspace,
          env: terminalEnvironment(),
        });
        sessions.set(id, { pty, workspace });
        pty.onData((data) => getWindow()?.webContents.send(`term:data:${id}`, data));
        pty.onExit(({ exitCode }) => {
          sessions.delete(id);
          getWindow()?.webContents.send(`term:exit:${id}`, exitCode);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        getWindow()?.webContents.send(
          `term:data:${id}`,
          `\r\n\x1b[31m[Luma] Failed to start ${profile.file}: ${message}\x1b[0m\r\n`
        );
        getWindow()?.webContents.send(`term:exit:${id}`, 1);
      }
    })();
  });
  ipcMain.on('term:write', (_event, id: string, data: string) => sessions.get(id)?.pty.write(data));
  ipcMain.on('term:resize', (_event, id: string, cols: number, rows: number) => {
    if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1) return;
    try {
      sessions.get(id)?.pty.resize(cols, rows);
    } catch {
      // The process may exit between lookup and resize.
    }
  });
  ipcMain.on('term:kill', (_event, id: string) => {
    sessions.get(id)?.pty.kill();
    sessions.delete(id);
  });
}
