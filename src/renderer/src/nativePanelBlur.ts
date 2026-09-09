import { useEffect, useRef } from 'react';
import {
  MAX_NATIVE_PANEL_BLUR_REGIONS,
  type NativePanelBlurPayload,
  type NativePanelBlurRegion,
} from '../../shared/nativePanelBlur';

const PANEL_SELECTOR = '.glass, .term-panel, .welcome-surface';

type NativePanelBlurBridge = typeof globalThis & {
  luma?: { winPanelBlur?: (payload: NativePanelBlurPayload) => void };
};

export function useNativePanelBlur(
  theme: 'cosmos' | 'liquid',
  strength: number
): void {
  const state = useRef({ theme, strength });
  const scheduleRef = useRef<() => void>(() => {});
  state.current = { theme, strength };

  useEffect(() => {
    const bridge = (globalThis as NativePanelBlurBridge).luma;
    if (!bridge?.winPanelBlur) return;

    let animationFrame = 0;
    const send = () => {
      animationFrame = 0;
      const current = state.current;
      const enabled = current.theme === 'liquid' && current.strength > 0;
      bridge.winPanelBlur?.({
        enabled,
        strength: current.strength,
        regions: enabled ? collectPanelBlurRegions() : [],
      });
    };
    const schedule = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(send);
    };
    scheduleRef.current = schedule;

    const resizeObserver = new ResizeObserver(schedule);
    const observePanels = () => {
      resizeObserver.disconnect();
      resizeObserver.observe(document.documentElement);
      for (const panel of topLevelPanelElements()) resizeObserver.observe(panel);
    };
    const mutationObserver = new MutationObserver(() => {
      observePanels();
      schedule();
    });
    observePanels();
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-awake'],
      childList: true,
      subtree: true,
    });
    window.addEventListener('resize', schedule);
    document.addEventListener('transitionend', schedule, true);
    schedule();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', schedule);
      document.removeEventListener('transitionend', schedule, true);
      scheduleRef.current = () => {};
      bridge.winPanelBlur?.({ enabled: false, strength: 0, regions: [] });
    };
  }, []);

  useEffect(() => scheduleRef.current(), [theme, strength]);
}

function topLevelPanelElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(PANEL_SELECTOR)).filter(
    (panel) => !panel.parentElement?.closest(PANEL_SELECTOR)
  );
}

export function collectPanelBlurRegions(): NativePanelBlurRegion[] {
  const regions: NativePanelBlurRegion[] = [];
  for (const panel of topLevelPanelElements()) {
    const style = getComputedStyle(panel);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0)
      continue;
    const bounds = panel.getBoundingClientRect();
    if (bounds.width < 2 || bounds.height < 2) continue;
    const radius = Math.max(
      Number.parseFloat(style.borderTopLeftRadius) || 0,
      Number.parseFloat(style.borderTopRightRadius) || 0,
      Number.parseFloat(style.borderBottomRightRadius) || 0,
      Number.parseFloat(style.borderBottomLeftRadius) || 0
    );
    regions.push({
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
      radius: Math.round(radius),
    });
    if (regions.length >= MAX_NATIVE_PANEL_BLUR_REGIONS) break;
  }
  return regions;
}
