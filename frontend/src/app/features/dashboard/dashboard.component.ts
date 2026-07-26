import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CompanionAction, CompanionComponent } from '../../shared/companion/companion.component';
import { TodayIdentity } from '../../core/models/dashboard.model';
import { HabitLogStatus } from '../../core/models/habit-log.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { HabitLogService } from '../../core/services/habit-log.service';
import { HabitService } from '../../core/services/habit.service';
import { IdentityService } from '../../core/services/identity.service';
import { addDays, isIsoDate, todayIso } from '../../core/util/date.util';

@Component({
  selector: 'app-dashboard',
  imports: [NgClass, FormsModule, RouterLink, CompanionComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly identities = signal<TodayIdentity[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly pendingHabitId = signal<string | null>(null);

  /** One-shot companion animations keyed by identity id, triggered on check-in. */
  readonly companionActions = signal<Record<string, CompanionAction>>({});
  private actionNonce = 0;

  /** A transient encouraging chat bubble shown by identity id when a habit is completed. */
  readonly encouragements = signal<Record<string, string>>({});
  private readonly encourageTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  /** Pool of encouraging messages; one is picked at random on each completed check-in. */
  private readonly encourageMessages = [
    'That\'s who you are now. 💪',
    'Another vote for your future self.',
    'Look at you, showing up. ✨',
    'One rep closer — keep going!',
    'Proud of you for that one.',
    'Small step, big identity.',
    'You did the thing! 🎉',
    'Consistency looks good on you.',
    'That\'s the streak talking. 🔥',
    'Future you says thanks.',
    'Every check-in shapes who you become.',
    'Momentum is on your side.',
    'You showed up today — that\'s what counts.',
    'Brick by brick, you\'re building it.',
    'Well done. Same time tomorrow?',
    'That\'s a win. Take it. 🙌',
  ];

  /** The identity whose companion is shown enlarged, plus the in-progress rename. */
  readonly enlargedId = signal<string | null>(null);
  readonly enlarged = computed(() =>
    this.identities().find((i) => i.id === this.enlargedId()) ?? null,
  );
  readonly nameDraft = signal('');
  readonly savingName = signal(false);

  readonly today = todayIso();
  /** The day currently on screen, driven by the `date` query param (defaults to today). */
  readonly selectedDate = signal(this.today);
  readonly isToday = computed(() => this.selectedDate() === this.today);
  readonly canGoForward = computed(() => this.selectedDate() < this.today);
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
      const date = isIsoDate(raw) && raw <= this.today ? raw : this.today;
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
    if (this.canGoForward()) {
      this.goToDate(addDays(this.selectedDate(), 1));
    }
  }

  goToToday(): void {
    this.goToDate(this.today);
  }

  private goToDate(date: string): void {
    const target = date > this.today ? this.today : date;
    this.router.navigate([], {
      relativeTo: this.route,
      // Keep the URL clean on the default (today) view.
      queryParams: { date: target === this.today ? null : target },
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
        this.reactToCheckIn(habitId, status);
        this.pendingHabitId.set(null);
      },
      error: () => {
        this.pendingHabitId.set(null);
        this.errorMessage.set('Could not save that check-in. Please try again.');
      },
    });
  }

  /** Cheer when a habit is completed, frown when it's missed. */
  private reactToCheckIn(habitId: string, status: HabitLogStatus): void {
    const kind: CompanionAction['kind'] | null =
      status === 'Completed' ? 'cheer' : status === 'Missed' ? 'frown' : null;
    if (!kind) return;

    const owner = this.identities().find((i) => i.habits.some((h) => h.id === habitId));
    if (!owner) return;

    this.companionActions.update((actions) => ({
      ...actions,
      [owner.id]: { kind, nonce: ++this.actionNonce },
    }));

    if (status === 'Completed') this.showEncouragement(owner.id);
  }

  /** Pop a random encouraging bubble over the given identity, auto-dismissing after a few seconds. */
  private showEncouragement(identityId: string): void {
    const message = this.encourageMessages[Math.floor(Math.random() * this.encourageMessages.length)];

    this.encouragements.update((current) => ({ ...current, [identityId]: message }));

    clearTimeout(this.encourageTimers[identityId]);
    this.encourageTimers[identityId] = setTimeout(() => {
      this.encouragements.update((current) => {
        const { [identityId]: _removed, ...rest } = current;
        return rest;
      });
    }, 3200);
  }

  openEnlarge(identity: TodayIdentity): void {
    this.nameDraft.set(identity.companionName ?? '');
    this.enlargedId.set(identity.id);
  }

  closeEnlarge(): void {
    this.enlargedId.set(null);
  }

  saveName(): void {
    const identity = this.enlarged();
    if (!identity || this.savingName()) return;

    const trimmed = this.nameDraft().trim();
    const newName = trimmed || null;
    this.savingName.set(true);

    this.identityService.update(identity.id, identity.statement, identity.companion, newName).subscribe({
      next: () => {
        this.identities.update((identities) =>
          identities.map((i) => (i.id === identity.id ? { ...i, companionName: newName } : i)),
        );
        this.savingName.set(false);
      },
      error: () => {
        this.savingName.set(false);
        this.errorMessage.set('Could not save that name. Please try again.');
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

  /**
   * Stroke offset for the companion's growth ring. The ring's dasharray is 283
   * (≈ 2πr for r = 45), so this returns how much of the circle stays unfilled.
   */
  ringOffset(progress: number): number {
    const clamped = Math.max(0, Math.min(100, progress));
    return 283 * (1 - clamped / 100);
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

  /** "Today" / "Yesterday" / "Mon, Jul 21" for the date navigator. */
  private labelFor(date: string): string {
    if (date === this.today) return 'Today';
    if (date === addDays(this.today, -1)) return 'Yesterday';
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
}
