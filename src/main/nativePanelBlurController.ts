import { BrowserWindow } from 'electron';
import type { NativePanelBlurPayload } from '../shared/nativePanelBlur';
import {
  nativePanelBlurOpacity,
  nativePanelBlurShape,
  normalizeNativePanelBlurPayload,
} from './nativePanelBlurGeometry';
import { enableNeutralNativeBlur } from './windowsNativeBlur';

const TRANSPARENT_DOCUMENT =
  'data:text/html;charset=utf-8,%3C!doctype%20html%3E%3Cmeta%20charset%3D%22utf-8%22%3E%3Cstyle%3Ehtml%2Cbody%7Bmargin%3A0%3Bwidth%3A100%25%3Bheight%3A100%25%3Bbackground%3Atransparent%3Boverflow%3Ahidden%7D%3C%2Fstyle%3E';

export class NativePanelBlurController {
  private layer: BrowserWindow | null = null;
  private payload: NativePanelBlurPayload = {
    enabled: false,
    strength: 0,
    regions: [],
  };
  private layerPrepared = false;
  private disposed = false;

  private readonly sync = () => this.render();
  private readonly hide = () => this.hideLayer();
  private readonly close = () => this.dispose();

  constructor(
    private readonly mainWindow: BrowserWindow,
    private readonly platform = process.platform,
  ) {
    if (platform !== 'win32') return;
    mainWindow.on('move', this.sync);
    mainWindow.on('resize', this.sync);
    mainWindow.on('restore', this.sync);
    mainWindow.on('show', this.sync);
    mainWindow.on('focus', this.sync);
    mainWindow.on('minimize', this.hide);
    mainWindow.on('hide', this.hide);
    mainWindow.on('closed', this.close);
  }

  update(value: unknown): void {
    if (
      this.disposed ||
      this.platform !== 'win32' ||
      this.mainWindow.isDestroyed()
    )
      return;
    this.payload = normalizeNativePanelBlurPayload(
      value,
      this.mainWindow.getContentBounds(),
    );
    this.render();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.removeListener('move', this.sync);
      this.mainWindow.removeListener('resize', this.sync);
      this.mainWindow.removeListener('restore', this.sync);
      this.mainWindow.removeListener('show', this.sync);
      this.mainWindow.removeListener('focus', this.sync);
      this.mainWindow.removeListener('minimize', this.hide);
      this.mainWindow.removeListener('hide', this.hide);
      this.mainWindow.removeListener('closed', this.close);
    }
    this.destroyLayer();
  }

  private render(): void {
    if (this.disposed || this.mainWindow.isDestroyed()) return;
    if (
      !this.payload.enabled ||
      !this.mainWindow.isVisible() ||
      this.mainWindow.isMinimized()
    ) {
      this.hideLayer();
      return;
    }

    const shape = nativePanelBlurShape(this.payload.regions);
    if (shape.length === 0) {
      this.hideLayer();
      return;
    }

    const layer = this.ensureLayer();
    if (!layer || layer.isDestroyed()) return;
    try {
      layer.setBounds(this.mainWindow.getContentBounds(), false);
      layer.setShape(shape);
      layer.setOpacity(nativePanelBlurOpacity(this.payload.strength));
    } catch {
      this.hideLayer();
      return;
    }
    if (this.layerPrepared && this.mainWindow.isFocused()) {
      this.showBehindMainWindow(layer);
    }
  }

  private ensureLayer(): BrowserWindow | null {
    if (this.layer && !this.layer.isDestroyed()) return this.layer;
    if (this.platform !== 'win32') return null;

    const layer = new BrowserWindow({
      ...this.mainWindow.getContentBounds(),
      useContentSize: true,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      backgroundMaterial: 'none',
      focusable: false,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      thickFrame: false,
      hasShadow: false,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    this.layer = layer;
    this.layerPrepared = false;
    layer.setIgnoreMouseEvents(true);
    layer.on('closed', () => {
      if (this.layer === layer) {
        this.layer = null;
        this.layerPrepared = false;
      }
    });
    void layer
      .loadURL(TRANSPARENT_DOCUMENT)
      .then(async () => {
        const blurEnabled = await enableNeutralNativeBlur(layer);
        if (this.layer !== layer || layer.isDestroyed() || this.disposed)
          return;
        if (!blurEnabled) {
          this.destroyLayer();
          return;
        }
        this.layerPrepared = true;
        this.render();
      })
      .catch(() => {
        if (this.layer === layer) this.destroyLayer();
      });
    return layer;
  }

  private showBehindMainWindow(layer: BrowserWindow): void {
    try {
      layer.showInactive();
      this.mainWindow.moveAbove(layer.getMediaSourceId());
    } catch {
      layer.hide();
    }
  }

  private hideLayer(): void {
    if (this.layer && !this.layer.isDestroyed() && this.layer.isVisible()) {
      this.layer.hide();
    }
  }

  private destroyLayer(): void {
    const layer = this.layer;
    this.layer = null;
    this.layerPrepared = false;
    if (layer && !layer.isDestroyed()) layer.destroy();
  }
}
