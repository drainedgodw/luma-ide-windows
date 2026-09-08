import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Detect the desktop wallpaper and return it as a bounded data URL. */
export async function getWallpaper(): Promise<string | null> {
  const candidates: string[] = [];

  if (process.platform === 'win32') {
    const registry = await execute('reg.exe', [
      'query',
      'HKCU\\Control Panel\\Desktop',
      '/v',
      'WallPaper',
    ]);
    const configured = registry ? parseWindowsWallpaper(registry) : null;
    if (configured) candidates.push(configured);
    const appData = process.env.APPDATA;
    if (appData) {
      const themes = join(appData, 'Microsoft', 'Windows', 'Themes');
      candidates.push(join(themes, 'TranscodedWallpaper'));
      const cached = join(themes, 'CachedFiles');
      for (const file of await readdir(cached).catch(() => [] as string[])) {
        candidates.push(join(cached, file));
      }
    }
  } else {
    for (const key of ['picture-uri-dark', 'picture-uri']) {
      const uri = await gsettingsGet('org.gnome.desktop.background', key);
      if (uri) candidates.push(fileFromUri(uri));
    }

    const kdeConfig = join(homedir(), '.config', 'plasma-org.kde.plasma.desktop-appletsrc');
    if (existsSync(kdeConfig)) {
      try {
        const text = await readFile(kdeConfig, 'utf8');
        const match = text.match(/Image=([^"\n]+)/);
        if (match) candidates.push(fileFromUri(match[1].trim()));
      } catch {
        // Try the remaining candidates.
      }
    }

    const cache = join(homedir(), '.cache', 'swww');
    if (existsSync(cache)) {
      for (const file of await readdir(cache).catch(() => [] as string[])) {
        if (/\.(png|jpe?g|webp)$/i.test(file)) candidates.push(join(cache, file));
      }
    }
  }

  candidates.push(
    join(homedir(), '.local', 'share', 'backgrounds', 'wallpaper.png'),
    join(homedir(), 'Pictures', 'wallpaper.jpg'),
    join(homedir(), 'Pictures', 'wallpaper.png'),
    '/usr/share/backgrounds/archlinux/archwall-paper.jpg',
    '/usr/share/backgrounds/defaults/desktop-background.jpg'
  );

  for (const path of candidates) {
    if (!path || !existsSync(path)) continue;
    try {
      const buffer = await readFile(path);
      if (buffer.length === 0 || buffer.length >= 25 * 1024 * 1024) continue;
      return `data:${imageMimeType(buffer, path)};base64,${buffer.toString('base64')}`;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

export function parseWindowsWallpaper(output: string): string | null {
  for (const line of output.split(/\r?\n/)) {
    if (!/\bWallPaper\b/i.test(line)) continue;
    const match = line.match(/\bREG_[A-Z_]+\s+(.+?)\s*$/i);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

export function imageMimeType(buffer: Buffer, path = ''): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return 'image/png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP')
    return 'image/webp';
  const extension = /\.(\w+)$/.exec(path)?.[1]?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'webp') return 'image/webp';
  return 'image/png';
}

function gsettingsGet(schema: string, key: string): Promise<string | null> {
  return execute('gsettings', ['get', schema, key]).then((value) =>
    value ? value.trim().replace(/^'|'$/g, '') : null
  );
}

function execute(command: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: 2000, windowsHide: true }, (error, stdout) => {
      resolve(error ? null : String(stdout).trim());
    });
  });
}

function fileFromUri(uri: string): string {
  if (uri.startsWith('file://')) return decodeURIComponent(uri.slice(7));
  return uri.startsWith('/') ? uri : '';
}
