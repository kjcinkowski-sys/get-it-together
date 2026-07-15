import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IdentityService } from '../../core/services/identity.service';

@Component({
  selector: 'app-identity-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './identity-form.component.html',
  styleUrl: './identity-form.component.scss',
})
export class IdentityFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly identityService = inject(IdentityService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    statement: ['', Validators.required],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { statement } = this.form.getRawValue();
    this.identityService.create(statement).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Could not create that identity. Please try again.');
      },
    });
  }
}
