import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FrequencyType } from '../../core/models/habit.model';
import { HabitService } from '../../core/services/habit.service';

/** Weekday options for scheduling, keyed by JS day number (0 = Sunday … 6 = Saturday). */
const WEEKDAYS: readonly { value: number; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

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

  readonly weekdays = WEEKDAYS;

  /** Selected weekdays; starts with every day selected. */
  readonly selectedDays = signal<ReadonlySet<number>>(new Set(WEEKDAYS.map((d) => d.value)));
  readonly hasDaySelected = computed(() => this.selectedDays().size > 0);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    frequencyType: this.fb.nonNullable.control<FrequencyType>('Daily', Validators.required),
    targetPerWeek: [7, [Validators.required, Validators.min(1), Validators.max(7)]],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  isDaySelected(day: number): boolean {
    return this.selectedDays().has(day);
  }

  toggleDay(day: number): void {
    this.selectedDays.update((days) => {
      const next = new Set(days);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  }

  submit(): void {
    if (this.form.invalid || !this.hasDaySelected() || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { name, frequencyType, targetPerWeek } = this.form.getRawValue();
    const scheduledDays = this.weekdays.map((d) => d.value).filter((d) => this.selectedDays().has(d));

    this.habitService.create(this.identityId, name, frequencyType, targetPerWeek, scheduledDays).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Could not create that habit. Please try again.');
      },
    });
  }
}
