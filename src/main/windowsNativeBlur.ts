import { app, type BrowserWindow } from 'electron';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const NATIVE_BLUR_HELPER = 'Luma.NativeBlur.exe';
const HELPER_TIMEOUT_MS = 5_000;

function nativeWindowHandleArgument(handle: Buffer): string | null {
  if (handle.length >= 8) {
    const value = handle.readBigUInt64LE(0);
    return value === 0n ? null : value.toString(10);
  }
  if (handle.length >= 4) {
    const value = handle.readUInt32LE(0);
    return value === 0 ? null : value.toString(10);
  }
  return null;
}

function nativeBlurHelperPath(): string | null {
  const candidates = app.isPackaged
    ? [join(process.resourcesPath, 'native', NATIVE_BLUR_HELPER)]
    : [
        join(app.getAppPath(), 'vendor', 'native', NATIVE_BLUR_HELPER),
        join(process.cwd(), 'vendor', 'native', NATIVE_BLUR_HELPER),
      ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export async function enableNeutralNativeBlur(
  window: BrowserWindow,
): Promise<boolean> {
  const executable = nativeBlurHelperPath();
  const handle = nativeWindowHandleArgument(window.getNativeWindowHandle());
  if (!executable || !handle) return false;

  return new Promise((resolve) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const finish = (success: boolean) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      resolve(success);
    };
    const child = spawn(executable, [handle, 'enable'], {
      shell: false,
      windowsHide: true,
      stdio: 'ignore',
    });
    timeout = setTimeout(() => {
      child.kill();
      finish(false);
    }, HELPER_TIMEOUT_MS);
    child.once('error', () => finish(false));
    child.once('exit', (code) => finish(code === 0));
  });
}
