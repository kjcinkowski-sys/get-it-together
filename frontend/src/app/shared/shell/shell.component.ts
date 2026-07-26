import { Component, signal } from '@angular/core';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LogoComponent } from '../logo/logo.component';
import { AuthService } from '../../core/services/auth.service';

/**
 * The authenticated app shell: a persistent side navigation plus a content area that
 * hosts the routed page via <router-outlet>. This is the single place the primary nav
 * lives — pages no longer carry their own header/nav.
 *
 * On desktop the nav is a fixed left rail; on narrow screens it collapses to a top bar
 * with a slide-in drawer so it doesn't eat horizontal space.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LogoComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  readonly menuOpen = signal(false);

  // The "My Identity" link points at '/', which also carries a `?date=` query param when a
  // past day is being viewed. Match on the path only so it stays highlighted regardless.
  readonly homeActiveOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };

  constructor(readonly authService: AuthService) {}

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.closeMenu();
    this.authService.logout();
  }

  initials(displayName: string): string {
    const name = displayName.trim();
    if (!name) return '?';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
