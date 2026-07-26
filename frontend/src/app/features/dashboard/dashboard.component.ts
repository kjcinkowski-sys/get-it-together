import { NgClass } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompanionComponent } from '../../shared/companion/companion.component';
import { TodayIdentity } from '../../core/models/dashboard.model';
import { HabitLogStatus } from '../../core/models/habit-log.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { HabitLogService } from '../../core/services/habit-log.service';
import { HabitService } from '../../core/services/habit.service';
import { IdentityService } from '../../core/services/identity.service';

function todayIso(): string {
  const now = new Date();
  const localMidnightOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - localMidnightOffsetMs).toISOString().slice(0, 10);
}

@Component({
  selector: 'app-dashboard',
  imports: [NgClass, RouterLink, CompanionComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly identities = signal<TodayIdentity[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly pendingHabitId = signal<string | null>(null);

  readonly today = todayIso();
  readonly statuses: HabitLogStatus[] = ['Completed', 'Partial', 'Missed'];

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly habitLogService: HabitLogService,
    private readonly habitService: HabitService,
    private readonly identityService: IdentityService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.dashboardService.today().subscribe({
      next: (identities) => {
        this.identities.set(identities);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load your dashboard. Please refresh.');
        this.loading.set(false);
      },
    });
  }

  checkIn(habitId: string, status: HabitLogStatus): void {
    this.pendingHabitId.set(habitId);

    this.habitLogService.checkIn(habitId, this.today, status).subscribe({
      next: () => {
        this.identities.update((identities) =>
          identities.map((identity) => ({
            ...identity,
            habits: identity.habits.map((habit) =>
              habit.id === habitId ? { ...habit, todayStatus: status } : habit,
            ),
          })),
        );
        this.pendingHabitId.set(null);
      },
      error: () => {
        this.pendingHabitId.set(null);
        this.errorMessage.set('Could not save that check-in. Please try again.');
      },
    });
  }

  archiveHabit(habitId: string): void {
    this.habitService.archive(habitId).subscribe({
      next: () => this.load(),
      error: () => this.errorMessage.set('Could not archive that habit.'),
    });
  }

  archiveIdentity(identityId: string): void {
    this.identityService.archive(identityId).subscribe({
      next: () => this.load(),
      error: () => this.errorMessage.set('Could not archive that identity.'),
    });
  }

  /** Short caption next to the stage name, e.g. "45% to next" or "fully grown". */
  growthCaption(identity: TodayIdentity): string {
    if (identity.stage >= 4) return 'fully grown';
    return `${identity.stageProgress}% to next`;
  }

  /** Tooltip describing the companion's growth. */
  growthTitle(identity: TodayIdentity): string {
    const streak = identity.streakDays === 1 ? '1-day streak' : `${identity.streakDays}-day streak`;
    if (identity.stage >= 4) return `${streak} · fully grown`;
    return `${streak} · ${identity.stageProgress}% to the next stage`;
  }

  /** A short human summary of a habit's schedule, e.g. "Daily" or "Mon · Wed · Fri". */
  scheduleLabel(scheduledDays: number[]): string {
    if (scheduledDays.length >= 7) return 'Daily';

    const abbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekOrder = [1, 2, 3, 4, 5, 6, 0];
    return weekOrder
      .filter((day) => scheduledDays.includes(day))
      .map((day) => abbr[day])
      .join(' · ');
  }
}
