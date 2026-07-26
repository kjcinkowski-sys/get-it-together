import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompanionAction, CompanionComponent } from '../../shared/companion/companion.component';
import { LogoComponent } from '../../shared/logo/logo.component';
import { TodayIdentity } from '../../core/models/dashboard.model';
import { HabitLogStatus } from '../../core/models/habit-log.model';
import { AuthService } from '../../core/services/auth.service';
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
  imports: [NgClass, FormsModule, RouterLink, CompanionComponent, LogoComponent],
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

  /** The identity whose companion is shown enlarged, plus the in-progress rename. */
  readonly enlargedId = signal<string | null>(null);
  readonly enlarged = computed(() =>
    this.identities().find((i) => i.id === this.enlargedId()) ?? null,
  );
  readonly nameDraft = signal('');
  readonly savingName = signal(false);

  readonly today = todayIso();
  readonly statuses: HabitLogStatus[] = ['Completed', 'Partial', 'Missed'];

  constructor(
    readonly authService: AuthService,
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

  logout(): void {
    this.authService.logout();
  }
}
