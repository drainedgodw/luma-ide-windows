import { describe, expect, it } from 'vitest';
import {
  nativePanelBlurOpacity,
  nativePanelBlurShape,
  normalizeNativePanelBlurPayload,
} from '../src/main/nativePanelBlurGeometry';

describe('native panel blur geometry', () => {
  it('clamps renderer regions to the transparent window', () => {
    const payload = normalizeNativePanelBlurPayload(
      {
        enabled: true,
        strength: 32,
        regions: [{ x: -5, y: 10, width: 105, height: 40, radius: 14 }],
      },
      { width: 80, height: 60 },
    );
    expect(payload).toEqual({
      enabled: true,
      strength: 32,
      regions: [{ x: 0, y: 10, width: 80, height: 40, radius: 14 }],
    });
  });

  it('rejects malformed regions and disables an empty shape', () => {
    const payload = normalizeNativePanelBlurPayload(
      {
        enabled: true,
        strength: 500,
        regions: [
          null,
          { x: 0, y: 0, width: -1, height: 20 },
          { x: '0', y: 0, width: 10, height: 10 },
        ],
      },
      { width: 100, height: 100 },
    );
    expect(payload.enabled).toBe(false);
    expect(payload.strength).toBe(64);
    expect(payload.regions).toEqual([]);
  });

  it('maps the slider linearly to neutral blur-layer opacity', () => {
    expect(nativePanelBlurOpacity(0)).toBe(0);
    expect(nativePanelBlurOpacity(16)).toBe(0.25);
    expect(nativePanelBlurOpacity(32)).toBe(0.5);
    expect(nativePanelBlurOpacity(64)).toBe(1);
    expect(nativePanelBlurOpacity(999)).toBe(1);
  });

  it('builds a rounded native window shape rather than a full-window rectangle', () => {
    const shape = nativePanelBlurShape([
      { x: 10, y: 20, width: 100, height: 50, radius: 14 },
    ]);
    expect(shape.length).toBeGreaterThan(1);
    expect(shape[0].x).toBeGreaterThan(10);
    expect(
      shape.some((rectangle) => rectangle.x === 10 && rectangle.width === 100),
    ).toBe(true);
    expect(
      shape.every(
        (rectangle) =>
          rectangle.y >= 20 && rectangle.y + rectangle.height <= 70,
      ),
    ).toBe(true);
  });
});
