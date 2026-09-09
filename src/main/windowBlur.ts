import type { BrowserWindow } from 'electron';

export function applyWindowBlur(
  window: Pick<BrowserWindow, 'isDestroyed' | 'setBackgroundMaterial'> | null,
  enabled: boolean,
  platform = process.platform
): boolean {
  if (platform !== 'win32' || !window || window.isDestroyed()) return false;
  try {
    window.setBackgroundMaterial(enabled ? 'acrylic' : 'none');
    return true;
  } catch {
    // Unsupported Windows/DWM combinations keep the real transparent window.
    return false;
  }
}
