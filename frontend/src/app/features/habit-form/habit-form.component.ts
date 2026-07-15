import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FrequencyType } from '../../core/models/habit.model';
import { HabitService } from '../../core/services/habit.service';

@Component({
  selector: 'app-habit-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './habit-form.component.html',
  styleUrl: './habit-form.component.scss',
})
export class HabitFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly habitService = inject(HabitService);
  private readonly router = inject(Router);

  private readonly identityId = this.route.snapshot.paramMap.get('identityId')!;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    frequencyType: this.fb.nonNullable.control<FrequencyType>('Daily', Validators.required),
    targetPerWeek: [7, [Validators.required, Validators.min(1), Validators.max(7)]],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { name, frequencyType, targetPerWeek } = this.form.getRawValue();
    this.habitService.create(this.identityId, name, frequencyType, targetPerWeek).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Could not create that habit. Please try again.');
      },
    });
  }
}
