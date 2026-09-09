import { describe, expect, it, vi } from 'vitest';
import { applyWindowBlur } from '../src/main/windowBlur';

describe('native Windows blur', () => {
  it('maps the boolean setting to fixed Acrylic or none materials', () => {
    const setBackgroundMaterial = vi.fn();
    const window = { isDestroyed: () => false, setBackgroundMaterial };
    expect(applyWindowBlur(window, true, 'win32')).toBe(true);
    expect(applyWindowBlur(window, false, 'win32')).toBe(true);
    expect(setBackgroundMaterial.mock.calls).toEqual([['acrylic'], ['none']]);
  });

  it('does not request a background material outside Windows', () => {
    const setBackgroundMaterial = vi.fn();
    const window = { isDestroyed: () => false, setBackgroundMaterial };
    expect(applyWindowBlur(window, true, 'linux')).toBe(false);
    expect(setBackgroundMaterial).not.toHaveBeenCalled();
  });

  it('preserves transparency if the compositor rejects Acrylic', () => {
    const window = {
      isDestroyed: () => false,
      setBackgroundMaterial: () => {
        throw new Error('unsupported');
      },
    };
    expect(applyWindowBlur(window, true, 'win32')).toBe(false);
  });
});
