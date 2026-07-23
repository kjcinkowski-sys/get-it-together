import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CompanionType } from '../../core/models/companion.model';
import { companionSvg } from './companion-art';

/**
 * Renders an identity's chosen companion at a given growth stage. Pure presentation — the
 * SVG comes from `companion-art`, driven by `type` + `stage` (`strength` only affects the
 * legacy Sprite). Size is controlled by the `size` input (px).
 */
@Component({
  selector: 'app-companion',
  imports: [],
  template: `<div class="companion" [style.width.px]="size()" [innerHTML]="svg()"></div>`,
  styles: [`
    .companion { display: block; }
    .companion ::ng-deep svg { display: block; width: 100%; height: auto; }
  `],
})
export class CompanionComponent {
  readonly type = input<CompanionType>('Sprite');
  readonly stage = input(0);
  readonly strength = input(0);
  readonly size = input(72);

  private readonly sanitizer = inject(DomSanitizer);

  readonly svg = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(companionSvg(this.type(), this.stage(), this.strength())),
  );
}
