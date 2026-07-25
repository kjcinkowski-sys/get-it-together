import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HabitService } from '../../core/services/habit.service';

/** Weekday options for scheduling, keyed by JS day number (0 = Sunday … 6 = Saturday). */
const WEEKDAYS: readonly { value: number; letter: string; name: string }[] = [
  { value: 1, letter: 'M', name: 'Monday' },
  { value: 2, letter: 'T', name: 'Tuesday' },
  { value: 3, letter: 'W', name: 'Wednesday' },
  { value: 4, letter: 'T', name: 'Thursday' },
  { value: 5, letter: 'F', name: 'Friday' },
  { value: 6, letter: 'S', name: 'Saturday' },
  { value: 0, letter: 'S', name: 'Sunday' },
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
  readonly allDaysSelected = computed(() => this.selectedDays().size === WEEKDAYS.length);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
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

  /** The "Daily" checkbox: selects every day, or clears the selection when already all set. */
  toggleDaily(): void {
    this.selectedDays.set(this.allDaysSelected() ? new Set() : new Set(WEEKDAYS.map((d) => d.value)));
  }

  submit(): void {
    if (this.form.invalid || !this.hasDaySelected() || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { name } = this.form.getRawValue();
    const scheduledDays = this.weekdays.map((d) => d.value).filter((d) => this.selectedDays().has(d));

    this.habitService.create(this.identityId, name, scheduledDays).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Could not create that habit. Please try again.');
      },
    });
  }
}
