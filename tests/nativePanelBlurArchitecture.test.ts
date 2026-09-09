import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('native panel-only blur architecture', () => {
  it('keeps both Electron windows untinted and clips neutral DWM blur to panels', async () => {
    const [main, controller, bridge, helper, preload, renderer, builder] =
      await Promise.all([
        readFile('src/main/index.ts', 'utf8'),
        readFile('src/main/nativePanelBlurController.ts', 'utf8'),
        readFile('src/main/windowsNativeBlur.ts', 'utf8'),
        readFile('native/windows-blur/luma-native-blur.cpp', 'utf8'),
        readFile('src/preload/index.ts', 'utf8'),
        readFile('src/renderer/src/nativePanelBlur.ts', 'utf8'),
        readFile('electron-builder.yml', 'utf8'),
      ]);
    expect(main).toContain("backgroundMaterial: 'none'");
    expect(controller).toContain("backgroundMaterial: 'none'");
    expect(`${main}\n${controller}`).not.toContain(
      "backgroundMaterial: 'acrylic'",
    );
    expect(controller).toContain('layer.setShape(shape)');
    expect(controller).toContain('layer.setIgnoreMouseEvents(true)');
    expect(controller).toContain(
      'this.mainWindow.moveAbove(layer.getMediaSourceId())',
    );
    expect(bridge).toContain("spawn(executable, [handle, 'enable']");
    expect(bridge).toContain('shell: false');
    expect(helper).toContain('EnableBlurBehind = 3');
    expect(helper).not.toContain('EnableAcrylicBlurBehind');
    expect(builder).toContain('Luma.NativeBlur.exe');
    expect(preload).toContain("ipcRenderer.send('win:panelBlur', payload)");
    expect(renderer).toContain(
      "PANEL_SELECTOR = '.glass, .term-panel, .welcome-surface'",
    );
  });
});
