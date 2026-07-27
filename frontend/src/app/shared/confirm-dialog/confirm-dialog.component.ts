import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * A small, reusable confirmation modal used to guard destructive actions (archive and delete).
 * Purely presentational: the host decides what to confirm by toggling it into view and reacts to
 * the (confirm)/(cancel) outputs. Set [danger]="true" for permanent deletes to get the red button
 * and warning tone.
 *
 * Reuses the app's modal look (backdrop + card) so it matches the companion enlarge modal.
 */
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="confirm-backdrop" (click)="cancel.emit()">
      <div class="confirm-card card" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
        <h2 class="confirm-title">{{ title }}</h2>
        <p class="confirm-message">{{ message }}</p>
        <div class="confirm-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel.emit()">
            {{ cancelLabel }}
          </button>
          <button
            type="button"
            class="btn"
            [class.btn-danger]="danger"
            [disabled]="busy"
            (click)="confirm.emit()"
          >
            {{ busy ? 'Working…' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .confirm-backdrop {
        position: fixed;
        inset: 0;
        z-index: 120;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.25rem;
        background: color-mix(in srgb, #000 45%, transparent);
        backdrop-filter: blur(2px);
        animation: confirm-fade 0.15s ease;
      }
      .confirm-card {
        width: 100%;
        max-width: 360px;
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
        padding: 1.4rem 1.25rem 1.15rem;
        animation: confirm-pop 0.18s ease;
      }
      .confirm-title {
        font-size: 1.1rem;
      }
      .confirm-message {
        color: var(--muted);
        font-size: 0.92rem;
        line-height: 1.45;
      }
      .confirm-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.6rem;
        margin-top: 0.4rem;
      }
      .btn-danger {
        background: var(--danger);
        color: var(--danger-ink);
      }
      @keyframes confirm-fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes confirm-pop {
        from { opacity: 0; transform: translateY(8px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .confirm-backdrop,
        .confirm-card {
          animation: none;
        }
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  @Input() title = 'Are you sure?';
  @Input() message = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  /** Red confirm button + warning tone, for permanent (hard-delete) actions. */
  @Input() danger = false;
  /** Disables the confirm button while the action is in flight. */
  @Input() busy = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
