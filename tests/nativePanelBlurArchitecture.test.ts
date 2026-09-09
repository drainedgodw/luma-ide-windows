import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('native panel-only blur architecture', () => {
  it('keeps the main window transparent and confines Acrylic to a shaped click-through layer', async () => {
    const [main, controller, preload, renderer] = await Promise.all([
      readFile('src/main/index.ts', 'utf8'),
      readFile('src/main/nativePanelBlurController.ts', 'utf8'),
      readFile('src/preload/index.ts', 'utf8'),
      readFile('src/renderer/src/nativePanelBlur.ts', 'utf8'),
    ]);
    expect(main).toContain("backgroundMaterial: 'none'");
    expect(main).not.toContain("backgroundMaterial: 'acrylic'");
    expect(controller).toContain("backgroundMaterial: 'acrylic'");
    expect(controller).toContain('layer.setShape(shape)');
    expect(controller).toContain('layer.setIgnoreMouseEvents(true)');
    expect(controller).toContain('this.mainWindow.moveAbove(layer.getMediaSourceId())');
    expect(preload).toContain("ipcRenderer.send('win:panelBlur', payload)");
    expect(renderer).toContain("PANEL_SELECTOR = '.glass, .term-panel, .welcome-surface'");
  });
});
