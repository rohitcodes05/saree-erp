import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Theme } from '@/types';

// ─── State Interface ──────────────────────────────────────────────────────────

interface ThemeStore {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// ─── Resolve System Theme ─────────────────────────────────────────────────────

function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}

// ─── Apply Theme to DOM ───────────────────────────────────────────────────────

function applyThemeToDom(resolved: 'dark' | 'light'): void {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(resolved);
  root.setAttribute('data-theme', resolved);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useThemeStore = create<ThemeStore>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'dark',
        resolvedTheme: 'dark',

        setTheme: (theme: Theme) => {
          const resolved = resolveTheme(theme);
          applyThemeToDom(resolved);
          set({ theme, resolvedTheme: resolved }, false, 'theme/setTheme');
        },

        toggleTheme: () => {
          const current = get().resolvedTheme;
          const next: Theme = current === 'dark' ? 'light' : 'dark';
          get().setTheme(next);
        },
      }),
      {
        name: 'saree-erp-theme',
        onRehydrateStorage: () => (state) => {
          if (state) {
            const resolved = resolveTheme(state.theme);
            state.resolvedTheme = resolved;
            applyThemeToDom(resolved);
          }
        },
      }
    ),
    { name: 'ThemeStore' }
  )
);

// ─── Initialize Theme on Load ─────────────────────────────────────────────────

export function initializeTheme(): void {
  const stored = localStorage.getItem('saree-erp-theme');
  let theme: Theme = 'dark';

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      theme = parsed?.state?.theme ?? 'dark';
    } catch {
      theme = 'dark';
    }
  }

  const resolved = resolveTheme(theme);
  applyThemeToDom(resolved);
}
