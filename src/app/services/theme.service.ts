import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>('light');

  constructor() {
    // Persist and restore from localStorage
    const stored = localStorage.getItem('erdi-theme') as Theme | null;
    if (stored === 'dark') {
      this.theme.set('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Keep DOM in sync whenever the signal changes
    effect(() => {
      const t = this.theme();
      if (t === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      localStorage.setItem('erdi-theme', t);
    });
  }

  toggle() {
    this.theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  get isDark() {
    return this.theme() === 'dark';
  }
}
