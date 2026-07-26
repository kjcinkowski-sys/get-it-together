import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'git-theme';
const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#f3f5f4',
  dark: '#0f1512',
};

/**
 * Owns the app's colour scheme. Persists the user's choice (light / dark / follow
 * system) in localStorage, mirrors it onto <html data-theme> so styles.scss can react,
 * and keeps the browser chrome colour in step. The matching pre-paint script in
 * index.html applies the same value before Angular boots to avoid a theme flash.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia?.(
    '(prefers-color-scheme: dark)',
  );

  readonly preference = signal<ThemePreference>(this.readStoredPreference());
  private readonly systemPrefersDark = signal(this.media?.matches ?? false);

  /** The concrete theme in effect once "system" has been resolved. */
  readonly resolved = computed<ResolvedTheme>(() => {
    const pref = this.preference();
    if (pref === 'system') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }
    return pref;
  });

  constructor() {
    this.media?.addEventListener?.('change', (event) =>
      this.systemPrefersDark.set(event.matches),
    );

    effect(() => this.applyResolvedTheme(this.resolved()));
  }

  /** Cycle order for a single toggle control: system → light → dark → system. */
  cycle(): void {
    const next: Record<ThemePreference, ThemePreference> = {
      system: 'light',
      light: 'dark',
      dark: 'system',
    };
    this.setPreference(next[this.preference()]);
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // localStorage can be unavailable (private mode, blocked cookies); theme still
      // applies for this session, it just won't persist.
    }
  }

  private applyResolvedTheme(theme: ResolvedTheme): void {
    const root = this.document.documentElement;
    root.setAttribute('data-theme', theme);

    const meta = this.document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', THEME_COLORS[theme]);
  }

  private readStoredPreference(): ThemePreference {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // Ignore and fall back to following the system preference.
    }
    return 'system';
  }
}
