import { Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

/**
 * Single button that cycles the colour scheme: system → light → dark → back.
 * The icon reflects the current *preference* (not the resolved theme) so the
 * "follow system" state is distinguishable from an explicit light/dark choice.
 */
@Component({
  selector: 'app-theme-toggle',
  template: `
    <button
      type="button"
      class="theme-toggle"
      [attr.aria-label]="label()"
      [title]="label()"
      (click)="theme.cycle()"
    >
      @switch (theme.preference()) {
        @case ('light') {
          <!-- Sun -->
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4.2" fill="currentColor" />
            <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12h2.5M19 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8" />
            </g>
          </svg>
        }
        @case ('dark') {
          <!-- Moon -->
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z"
              fill="currentColor"
            />
          </svg>
        }
        @default {
          <!-- Auto: half-filled circle -->
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8" />
            <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
          </svg>
        }
      }
    </button>
  `,
  styles: [
    `
      .theme-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        padding: 0;
        border: 1px solid var(--line);
        border-radius: 50%;
        background: var(--surface);
        color: var(--muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition:
          color 0.15s ease,
          border-color 0.15s ease;
      }
      .theme-toggle:hover {
        color: var(--accent);
        border-color: var(--accent);
      }
      .theme-toggle:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      .theme-toggle svg {
        display: block;
      }
    `,
  ],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);

  readonly label = computed(() => {
    switch (this.theme.preference()) {
      case 'light':
        return 'Theme: light — switch to dark';
      case 'dark':
        return 'Theme: dark — switch to automatic';
      default:
        return 'Theme: automatic — switch to light';
    }
  });
}
