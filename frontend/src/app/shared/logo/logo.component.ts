import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <span class="brand">
      <svg
        #mark
        class="brand__mark"
        [class.brand__mark--anim]="animated || loop"
        [attr.width]="size"
        [attr.height]="size"
        viewBox="0 0 64 64"
        role="img"
        aria-label="Get It Together logo"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle class="ring" style="animation-delay: 0s" cx="32" cy="32" r="6" fill="#6E4A28" />
        <circle class="ring" style="animation-delay: 0.3s" cx="32" cy="32" r="12" fill="none" stroke="#639922" stroke-width="5" />
        <circle class="ring" style="animation-delay: 0.6s" cx="32" cy="32" r="20" fill="none" stroke="#1D9E75" stroke-width="5" />
        <circle class="ring" style="animation-delay: 0.9s" cx="32" cy="32" r="28" fill="none" stroke="#378ADD" stroke-width="5" />
      </svg>
      @if (showWord) {
        <span class="brand__word">Get It Together</span>
      }
    </span>
  `,
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 0.6rem;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
      }
      .brand__mark {
        display: block;
        flex: none;
      }
      .brand__word {
        font-weight: 700;
        font-size: 1.05rem;
        letter-spacing: -0.01em;
        color: var(--ink);
        white-space: nowrap;
      }
      .brand__mark--anim .ring {
        transform-box: fill-box;
        transform-origin: center;
        opacity: 0;
      }
      .brand__mark--anim.play .ring {
        animation: brandGrow 0.6s cubic-bezier(0.34, 1.45, 0.5, 1) both;
      }
      @keyframes brandGrow {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .brand__mark--anim .ring {
          opacity: 1;
          transform: none;
          animation: none;
        }
      }
    `,
  ],
})
export class LogoComponent implements AfterViewInit, OnDestroy {
  @Input() size = 28;
  @Input() showWord = true;
  /** Play the grow-in sequence once. */
  @Input() animated = false;
  /** Repeat the grow-in sequence on an interval. */
  @Input() loop = false;

  @ViewChild('mark') private markRef?: ElementRef<SVGElement>;
  private timer?: ReturnType<typeof setInterval>;

  ngAfterViewInit(): void {
    if (this.animated || this.loop) this.play();
    if (this.loop) this.timer = setInterval(() => this.play(), 2100);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private play(): void {
    const el = this.markRef?.nativeElement;
    if (!el) return;
    el.classList.remove('play');
    // Force reflow so re-adding the class restarts the CSS animation.
    void (el as unknown as HTMLElement).offsetWidth;
    el.classList.add('play');
  }
}
