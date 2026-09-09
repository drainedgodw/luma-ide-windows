import { createContext, useContext, useEffect, useState } from 'react';
import { playUISound, soundForButton } from './uiSounds';

export const DEFAULT_PANEL_BLUR = 32;
export const MAX_PANEL_BLUR = 64;

export function normalizePanelBlur(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_PANEL_BLUR;
  return Math.min(MAX_PANEL_BLUR, Math.max(0, Math.round(value)));
}

export interface Settings {
  fontSize: number;
  tabSize: number;
  autocomplete: boolean;
  showCommandsOnAction: boolean;
  reduceMotion: boolean;
  wordWrap: boolean;
  theme: 'cosmos' | 'liquid';
  panelBlur: number;
  installedPacks: string[];
  explorer: 'pinned' | 'auto';
  soundEffects: boolean;
  soundVolume: number;
}

const DEFAULTS: Settings = {
  fontSize: 13,
  tabSize: 2,
  autocomplete: true,
  showCommandsOnAction: true,
  reduceMotion: false,
  wordWrap: false,
  theme: 'cosmos',
  panelBlur: DEFAULT_PANEL_BLUR,
  installedPacks: ['typescript', 'javascript'],
  explorer: 'auto',
  soundEffects: true,
  soundVolume: 0.45,
};

const KEY = 'luma.settings';
type StoredSettings = Partial<Settings> & { wallpaperBlur?: unknown };
type NativeBlurBridge = typeof globalThis & {
  luma?: { winBlur?: (enabled: boolean) => void };
};
const Ctx = createContext<{ settings: Settings; update: (patch: Partial<Settings>) => void }>({ settings: DEFAULTS, update: () => {} });
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}') as StoredSettings;
      const storedBlur = normalizePanelBlur(stored.panelBlur ?? stored.wallpaperBlur);
      return {
        ...DEFAULTS,
        ...stored,
        panelBlur: storedBlur > 0 ? DEFAULT_PANEL_BLUR : 0,
      };
    } catch {
      return DEFAULTS;
    }
  });
  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));
  useEffect(() => {
    const blurEnabled = settings.theme === 'liquid' && settings.panelBlur > 0;
    localStorage.setItem(KEY, JSON.stringify(settings));
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.blur = blurEnabled ? 'on' : 'off';
    document.documentElement.style.setProperty(
      '--panel-blur',
      `${settings.panelBlur > 0 ? DEFAULT_PANEL_BLUR : 0}px`
    );
    (globalThis as NativeBlurBridge).luma?.winBlur?.(blurEnabled);
  }, [settings]);
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!settings.soundEffects || settings.soundVolume <= 0 || !(event.target instanceof Element)) return;
      const button = event.target.closest('button');
      if (!(button instanceof HTMLButtonElement) || button.disabled) return;
      const sound = soundForButton(button);
      if (sound) playUISound(sound, settings.soundVolume);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [settings.soundEffects, settings.soundVolume]);
  useEffect(() => {
    const on = (e: Event) => update({ theme: (e as CustomEvent<'cosmos' | 'liquid'>).detail });
    window.addEventListener('luma:theme', on);
    return () => window.removeEventListener('luma:theme', on);
  });
  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}
