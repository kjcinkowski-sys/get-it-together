import { NgClass } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CompanionComponent } from '../../shared/companion/companion.component';
import { TodayIdentity } from '../../core/models/dashboard.model';
import { HabitLogStatus } from '../../core/models/habit-log.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { HabitLogService } from '../../core/services/habit-log.service';
import { HabitService } from '../../core/services/habit.service';
import { IdentityService } from '../../core/services/identity.service';
import { addDays, isIsoDate, todayIso } from '../../core/util/date.util';

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
  /** The day currently on screen, driven by the `date` query param (defaults to today). */
  readonly selectedDate = signal(this.today);
  readonly isToday = computed(() => this.selectedDate() === this.today);
  readonly isFuture = computed(() => this.selectedDate() > this.today);
  readonly dateLabel = computed(() => this.labelFor(this.selectedDate()));

  readonly statuses: HabitLogStatus[] = ['Completed', 'Partial', 'Missed'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dashboardService: DashboardService,
    private readonly habitLogService: HabitLogService,
    private readonly habitService: HabitService,
    private readonly identityService: IdentityService,
  ) {}

  ngOnInit(): void {
    // The URL owns the viewed day, so arrows, the calendar, and the back button all agree.
    this.route.queryParamMap.subscribe((params) => {
      const raw = params.get('date');
      const date = isIsoDate(raw) ? raw : this.today;
      this.selectedDate.set(date);
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.dashboardService.forDate(this.selectedDate()).subscribe({
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

  previousDay(): void {
    this.goToDate(addDays(this.selectedDate(), -1));
  }

  nextDay(): void {
    this.goToDate(addDays(this.selectedDate(), 1));
  }

  goToToday(): void {
    this.goToDate(this.today);
  }

  private goToDate(date: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      // Keep the URL clean on the default (today) view.
      queryParams: { date: date === this.today ? null : date },
      queryParamsHandling: 'merge',
    });
  }

  checkIn(habitId: string, status: HabitLogStatus): void {
    // Only today is editable; past days are review-only.
    if (!this.isToday()) return;

    this.pendingHabitId.set(habitId);

    this.habitLogService.checkIn(habitId, this.selectedDate(), status).subscribe({
      next: () => {
        this.identities.update((identities) =>
          identities.map((identity) => ({
            ...identity,
            habits: identity.habits.map((habit) =>
              habit.id === habitId ? { ...habit, status } : habit,
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

  /** "Today" / "Yesterday" / "Tomorrow" / "Mon, Jul 21" for the date navigator. */
  private labelFor(date: string): string {
    if (date === this.today) return 'Today';
    if (date === addDays(this.today, -1)) return 'Yesterday';
    if (date === addDays(this.today, 1)) return 'Tomorrow';
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
}
