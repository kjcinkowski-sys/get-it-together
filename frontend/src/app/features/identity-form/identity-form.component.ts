import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { COMPANION_OPTIONS, CompanionType } from '../../core/models/companion.model';
import { IdentityService } from '../../core/services/identity.service';
import { CompanionComponent } from '../../shared/companion/companion.component';

@Component({
  selector: 'app-identity-form',
  imports: [ReactiveFormsModule, RouterLink, CompanionComponent],
  templateUrl: './identity-form.component.html',
  styleUrl: './identity-form.component.scss',
})
export class IdentityFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly identityService = inject(IdentityService);
  private readonly router = inject(Router);

  readonly companionOptions = COMPANION_OPTIONS;
  /** Stage shown in the picker previews — grown enough to look appealing. */
  readonly previewStage = 3;

  readonly form = this.fb.nonNullable.group({
    statement: ['', Validators.required],
    companion: ['Tree' as CompanionType, Validators.required],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  selectCompanion(type: CompanionType): void {
    this.form.controls.companion.setValue(type);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { statement, companion } = this.form.getRawValue();
    this.identityService.create(statement, companion).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Could not create that identity. Please try again.');
      },
    });
  }
}
