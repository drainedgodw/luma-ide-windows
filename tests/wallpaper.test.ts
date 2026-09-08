import { describe, expect, it } from 'vitest';
import { imageMimeType, parseWindowsWallpaper } from '../src/main/wallpaper';

describe('Windows wallpaper detection', () => {
  it('reads the wallpaper path from reg.exe output', () => {
    expect(parseWindowsWallpaper(`HKEY_CURRENT_USER\\Control Panel\\Desktop\r\n    WallPaper    REG_SZ    C:\\Windows\\Web\\Wallpaper\\Windows\\img0.jpg\r\n`))
      .toBe('C:\\Windows\\Web\\Wallpaper\\Windows\\img0.jpg');
  });

  it('detects extensionless transcoded JPEG data', () => {
    expect(imageMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), 'TranscodedWallpaper'))
      .toBe('image/jpeg');
  });
});
