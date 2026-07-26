import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CompanionType } from '../../core/models/companion.model';
import { CompanionMood, companionSvg } from './companion-art';

/** A one-shot animation request. Bump `nonce` to replay the same `kind`. */
export interface CompanionAction {
  kind: 'cheer' | 'frown' | 'tap';
  nonce: number;
}

/**
 * Renders an identity's chosen companion at a given growth stage and plays its reactions.
 * The SVG comes from `companion-art`, driven by `type` + `stage` (`strength` only affects the
 * legacy Sprite). Emotions and motion are layered on with CSS: set `action` to cheer/frown from
 * a parent (e.g. on check-in), or make the companion `clickable` so a tap plays its signature
 * move (tree waves, cat purrs, butterfly flutters, sprite squishes) and emits `enlarge`.
 */
@Component({
  selector: 'app-companion',
  imports: [],
  template: `
    <div [class]="wrapperClass()" (click)="onClick()">
      <div class="companion__art" [style.width.px]="size()" [innerHTML]="svg()"></div>
      <span class="spark spark--1" aria-hidden="true"></span>
      <span class="spark spark--2" aria-hidden="true"></span>
      <span class="spark spark--3" aria-hidden="true"></span>
      <span class="spark spark--4" aria-hidden="true"></span>
    </div>
  `,
  styles: [`
    .companion { display: inline-block; position: relative; line-height: 0; }
    .companion__art { display: block; transition: transform 0.15s ease; }
    .companion ::ng-deep svg { display: block; width: 100%; height: auto; transform-origin: 50% 88%; }
    .companion--clickable { cursor: pointer; }
    .companion--clickable:hover .companion__art { transform: scale(1.06); }

    .companion.a-cheer ::ng-deep svg { animation: companion-cheer 1.1s ease; }
    .companion.a-sad ::ng-deep svg { animation: companion-sad 1.6s ease; }
    .companion.a-wiggle ::ng-deep svg { animation: companion-wiggle 0.7s ease; }
    .companion.a-flutter ::ng-deep svg { animation: companion-rise 0.9s ease; }
    .companion.a-purr ::ng-deep svg { animation: companion-purr 0.12s linear 8; }
    .companion.a-squish ::ng-deep svg { animation: companion-squish 0.5s ease; }
    .companion.a-wave ::ng-deep .wave-arm { animation: companion-wave 0.9s ease; }
    .companion.a-flutter ::ng-deep .wingL,
    .companion.a-flutter ::ng-deep .wingR { animation: companion-flap 0.3s ease-in-out 3; }

    .spark {
      position: absolute; top: 20%; left: 50%; width: 6px; height: 6px;
      border-radius: 50%; background: #e7c65c; opacity: 0; pointer-events: none;
    }
    .spark--1 { left: 22%; top: 30%; }
    .spark--2 { left: 74%; top: 26%; }
    .spark--3 { left: 40%; top: 12%; }
    .spark--4 { left: 60%; top: 40%; }
    .companion.a-cheer .spark { animation: companion-spark 0.9s ease-out; }
    .companion.a-cheer .spark--2 { animation-delay: 0.1s; }
    .companion.a-cheer .spark--3 { animation-delay: 0.18s; }
    .companion.a-cheer .spark--4 { animation-delay: 0.26s; }

    @keyframes companion-cheer {
      0% { transform: translateY(0) scale(1); } 18% { transform: translateY(-15px) scale(1.06); }
      36% { transform: translateY(0) scale(1); } 52% { transform: translateY(-9px); }
      68% { transform: translateY(0); } 84% { transform: translateY(-3px); } 100% { transform: translateY(0); }
    }
    @keyframes companion-sad {
      0% { transform: translateY(0) scale(1) rotate(0); } 18% { transform: translateY(5px) scale(0.96) rotate(-3deg); }
      45% { transform: translateY(6px) scale(0.95) rotate(3deg); } 70% { transform: translateY(6px) scale(0.95) rotate(-2deg); }
      100% { transform: translateY(0) scale(1) rotate(0); }
    }
    @keyframes companion-wave {
      0%, 100% { transform: rotate(0); } 25% { transform: rotate(20deg); }
      50% { transform: rotate(-4deg); } 75% { transform: rotate(16deg); }
    }
    @keyframes companion-wiggle {
      0%, 100% { transform: rotate(0); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); }
    }
    @keyframes companion-rise { 0% { transform: translateY(0); } 50% { transform: translateY(-18px); } 100% { transform: translateY(0); } }
    @keyframes companion-flap { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(0.32); } }
    @keyframes companion-purr { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-1.4px); } 75% { transform: translateX(1.4px); } }
    @keyframes companion-squish {
      0% { transform: scale(1, 1); } 30% { transform: scale(1.1, 0.9); } 60% { transform: scale(0.95, 1.05); } 100% { transform: scale(1, 1); }
    }
    @keyframes companion-spark {
      0% { opacity: 0; transform: translateY(0) scale(0.6); } 20% { opacity: 1; }
      100% { opacity: 0; transform: translateY(-30px) scale(1.1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .companion ::ng-deep svg, .companion ::ng-deep .wave-arm,
      .companion ::ng-deep .wingL, .companion ::ng-deep .wingR, .spark { animation: none !important; }
    }
  `],
})
export class CompanionComponent {
  readonly type = input<CompanionType>('Sprite');
  readonly stage = input(0);
  readonly strength = input(0);
  readonly size = input(72);
  readonly clickable = input(false);
  /** One-shot cheer/frown/tap requested by a parent; bump `nonce` to replay. */
  readonly action = input<CompanionAction | null>(null);
  /** Emitted when a `clickable` companion is tapped, after starting its tap animation. */
  readonly enlarge = output<void>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly mood = signal<CompanionMood>('neutral');
  private readonly anim = signal<string>('');
  private timer?: ReturnType<typeof setTimeout>;

  readonly wrapperClass = computed(() => {
    const parts = ['companion'];
    if (this.clickable()) parts.push('companion--clickable');
    if (this.anim()) parts.push(this.anim());
    return parts.join(' ');
  });
  readonly svg = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      companionSvg(this.type(), this.stage(), this.strength(), this.mood()),
    ),
  );

  constructor() {
    let lastNonce: number | null = null;
    effect(() => {
      const a = this.action();
      if (!a || a.nonce === lastNonce) return;
      lastNonce = a.nonce;
      this.play(a.kind);
    });
  }

  onClick(): void {
    if (!this.clickable()) return;
    this.play('tap');
    this.enlarge.emit();
  }

  private play(kind: CompanionAction['kind']): void {
    clearTimeout(this.timer);
    if (kind === 'cheer') {
      this.mood.set('happy');
      this.anim.set('a-cheer');
      this.timer = setTimeout(() => this.reset(), 1300);
    } else if (kind === 'frown') {
      this.mood.set('sad');
      this.anim.set('a-sad');
      this.timer = setTimeout(() => this.reset(), 1700);
    } else {
      this.anim.set(this.tapClass());
      this.timer = setTimeout(() => this.reset(), 1100);
    }
  }

  private tapClass(): string {
    const type = this.type(), stage = this.stage();
    if (type === 'Cat') {
      this.mood.set('purr');
      return 'a-purr';
    }
    if (type === 'Sprite') return 'a-squish';
    if (type === 'Tree') return stage >= 3 ? 'a-wave' : 'a-wiggle';
    return stage === 4 ? 'a-flutter' : 'a-wiggle';
  }

  private reset(): void {
    this.mood.set('neutral');
    this.anim.set('');
  }
}
