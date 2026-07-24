import { Component, OnInit, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { LogoComponent } from './shared/logo/logo.component';

const MIN_SPLASH_MS = 1800;
const MIN_NAV_LOADER_MS = 700;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LogoComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  readonly booting = signal(true);
  readonly splashLeaving = signal(false);
  readonly navigating = signal(false);

  private minSplashElapsed = false;
  private firstNavDone = false;
  private navStartAt = 0;
  private navHideTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (!this.booting()) {
          clearTimeout(this.navHideTimer);
          if (!this.navigating()) {
            this.navStartAt = Date.now();
            this.navigating.set(true);
          }
        }
        return;
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        if (!this.firstNavDone) {
          this.firstNavDone = true;
          this.maybeDismissSplash();
        }
        this.hideNavLoader();
      }
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.minSplashElapsed = true;
      this.maybeDismissSplash();
    }, MIN_SPLASH_MS);
  }

  private hideNavLoader(): void {
    if (!this.navigating()) return;
    const remaining = Math.max(0, MIN_NAV_LOADER_MS - (Date.now() - this.navStartAt));
    clearTimeout(this.navHideTimer);
    this.navHideTimer = setTimeout(() => this.navigating.set(false), remaining);
  }

  private maybeDismissSplash(): void {
    if (!this.minSplashElapsed || !this.firstNavDone || this.splashLeaving()) return;
    this.splashLeaving.set(true);
    setTimeout(() => this.booting.set(false), 400);
  }
}
