export const MAX_NATIVE_PANEL_BLUR_REGIONS = 24;
export const MAX_NATIVE_PANEL_BLUR_STRENGTH = 64;
export const MAX_NATIVE_PANEL_RADIUS = 32;

export interface NativePanelBlurRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

export interface NativePanelBlurPayload {
  enabled: boolean;
  strength: number;
  regions: NativePanelBlurRegion[];
}
