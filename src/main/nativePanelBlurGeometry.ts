import {
  MAX_NATIVE_PANEL_BLUR_REGIONS,
  MAX_NATIVE_PANEL_BLUR_STRENGTH,
  MAX_NATIVE_PANEL_RADIUS,
  type NativePanelBlurPayload,
  type NativePanelBlurRegion,
} from '../shared/nativePanelBlur';

export interface PanelBlurBounds {
  width: number;
  height: number;
}

export interface PanelBlurShapeRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const finiteNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const recordValue = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;

export function normalizeNativePanelBlurPayload(
  value: unknown,
  bounds: PanelBlurBounds,
): NativePanelBlurPayload {
  const record = recordValue(value);
  const boundWidth = clamp(
    Math.round(finiteNumber(bounds.width) ?? 0),
    0,
    16_384,
  );
  const boundHeight = clamp(
    Math.round(finiteNumber(bounds.height) ?? 0),
    0,
    16_384,
  );
  const requestedStrength = finiteNumber(record?.strength) ?? 0;
  const strength = clamp(
    Math.round(requestedStrength),
    0,
    MAX_NATIVE_PANEL_BLUR_STRENGTH,
  );
  const regions: NativePanelBlurRegion[] = [];
  const requestedRegions = Array.isArray(record?.regions) ? record.regions : [];

  for (const requested of requestedRegions.slice(
    0,
    MAX_NATIVE_PANEL_BLUR_REGIONS,
  )) {
    const region = recordValue(requested);
    if (!region) continue;
    const rawX = finiteNumber(region.x);
    const rawY = finiteNumber(region.y);
    const rawWidth = finiteNumber(region.width);
    const rawHeight = finiteNumber(region.height);
    if (
      rawX === null ||
      rawY === null ||
      rawWidth === null ||
      rawHeight === null
    )
      continue;
    if (rawWidth <= 0 || rawHeight <= 0) continue;

    const left = clamp(Math.floor(rawX), 0, boundWidth);
    const top = clamp(Math.floor(rawY), 0, boundHeight);
    const right = clamp(Math.ceil(rawX + rawWidth), 0, boundWidth);
    const bottom = clamp(Math.ceil(rawY + rawHeight), 0, boundHeight);
    const width = right - left;
    const height = bottom - top;
    if (width < 2 || height < 2) continue;

    const maximumRadius = Math.min(
      MAX_NATIVE_PANEL_RADIUS,
      Math.floor(Math.min(width, height) / 2),
    );
    const radius = clamp(
      Math.round(finiteNumber(region.radius) ?? 0),
      0,
      maximumRadius,
    );
    regions.push({ x: left, y: top, width, height, radius });
  }

  return {
    enabled: record?.enabled === true && strength > 0 && regions.length > 0,
    strength,
    regions,
  };
}

export function nativePanelBlurOpacity(strength: number): number {
  const normalized = clamp(
    Math.round(Number.isFinite(strength) ? strength : 0),
    0,
    MAX_NATIVE_PANEL_BLUR_STRENGTH,
  );
  return Number((normalized / MAX_NATIVE_PANEL_BLUR_STRENGTH).toFixed(4));
}

export function nativePanelBlurShape(
  regions: readonly NativePanelBlurRegion[],
): PanelBlurShapeRectangle[] {
  return regions.flatMap(roundedRectangleShape);
}

function roundedRectangleShape(
  region: NativePanelBlurRegion,
): PanelBlurShapeRectangle[] {
  const radius = Math.min(
    Math.max(0, Math.round(region.radius)),
    Math.floor(Math.min(region.width, region.height) / 2),
  );
  if (radius === 0)
    return [
      { x: region.x, y: region.y, width: region.width, height: region.height },
    ];

  const rows: PanelBlurShapeRectangle[] = [];
  for (let row = 0; row < region.height; row += 1) {
    const edgeDistance = Math.min(row + 0.5, region.height - row - 0.5);
    let inset = 0;
    if (edgeDistance < radius) {
      const vertical = radius - edgeDistance;
      inset = Math.ceil(
        radius - Math.sqrt(Math.max(0, radius * radius - vertical * vertical)),
      );
    }
    const width = region.width - inset * 2;
    if (width <= 0) continue;
    const previous = rows.at(-1);
    if (
      previous &&
      previous.x === region.x + inset &&
      previous.width === width &&
      previous.y + previous.height === region.y + row
    ) {
      previous.height += 1;
    } else {
      rows.push({ x: region.x + inset, y: region.y + row, width, height: 1 });
    }
  }
  return rows;
}
