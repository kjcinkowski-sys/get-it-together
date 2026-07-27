import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompanionComponent } from '../../shared/companion/companion.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { Habit } from '../../core/models/habit.model';
import { Identity } from '../../core/models/identity.model';
import { StatsIdentity } from '../../core/models/stats.model';
import { HabitService } from '../../core/services/habit.service';
import { IdentityService } from '../../core/services/identity.service';
import { StatsService } from '../../core/services/stats.service';

/** A pending destructive action awaiting confirmation in the shared dialog. */
interface ConfirmAction {
  kind: 'archive-habit' | 'delete-habit' | 'archive-identity' | 'delete-identity';
  id: string;
  /** Human label (habit or identity name) shown in the confirmation copy. */
  name: string;
}

@Component({
  selector: 'app-my-habits',
  imports: [RouterLink, CompanionComponent, ConfirmDialogComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
})
export class StatsComponent implements OnInit {
  readonly identities = signal<StatsIdentity[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  /** Identity ids whose archived-habits panel is expanded. */
  readonly expandedArchived = signal<ReadonlySet<string>>(new Set());
  /** Archived habits per identity, loaded lazily when the panel is opened. */
  readonly archivedHabits = signal<Record<string, Habit[]>>({});
  /** Archived identities, shown in the page-level "Archived identities" section. */
  readonly archivedIdentities = signal<Identity[]>([]);
  readonly showArchivedIdentities = signal(false);

  /** The action awaiting confirmation, or null when the dialog is closed. */
  readonly pendingConfirm = signal<ConfirmAction | null>(null);
  readonly confirmBusy = signal(false);

  constructor(
    private readonly statsService: StatsService,
    private readonly habitService: HabitService,
    private readonly identityService: IdentityService,
  ) {}

  ngOnInit(): void {
    this.loadOverview();
    this.loadArchivedIdentities();
  }

  private loadOverview(): void {
    this.loading.set(true);
    this.statsService.overview().subscribe({
      next: (identities) => {
        this.identities.set(identities);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load your habits. Please refresh.');
        this.loading.set(false);
      },
    });
  }

  private loadArchivedIdentities(): void {
    this.identityService.listArchived().subscribe({
      next: (identities) => this.archivedIdentities.set(identities),
      error: () => {
        /* Non-fatal: the archived section just stays empty. */
      },
    });
  }

  // --- Archived habits panel ---------------------------------------------------------------

  isArchivedOpen(identityId: string): boolean {
    return this.expandedArchived().has(identityId);
  }

  toggleArchivedHabits(identityId: string): void {
    const open = new Set(this.expandedArchived());
    if (open.has(identityId)) {
      open.delete(identityId);
    } else {
      open.add(identityId);
      this.loadArchivedHabits(identityId);
    }
    this.expandedArchived.set(open);
  }

  private loadArchivedHabits(identityId: string): void {
    this.habitService.listArchived(identityId).subscribe({
      next: (habits) => this.archivedHabits.update((map) => ({ ...map, [identityId]: habits })),
      error: () => this.errorMessage.set('Could not load archived habits.'),
    });
  }

  archivedHabitsFor(identityId: string): Habit[] | undefined {
    return this.archivedHabits()[identityId];
  }

  // --- Restore (no confirmation needed — non-destructive) ----------------------------------

  restoreHabit(habitId: string): void {
    this.habitService.restore(habitId).subscribe({
      next: () => this.refreshAll(),
      error: () => this.errorMessage.set('Could not restore that habit.'),
    });
  }

  restoreIdentity(identityId: string): void {
    this.identityService.restore(identityId).subscribe({
      next: () => this.refreshAll(),
      error: () => this.errorMessage.set('Could not restore that identity.'),
    });
  }

  // --- Confirmation flow for destructive actions -------------------------------------------

  askArchiveHabit(habit: { id: string; name: string }): void {
    this.pendingConfirm.set({ kind: 'archive-habit', id: habit.id, name: habit.name });
  }

  askDeleteHabit(habit: { id: string; name: string }): void {
    this.pendingConfirm.set({ kind: 'delete-habit', id: habit.id, name: habit.name });
  }

  askArchiveIdentity(identity: { id: string; statement: string }): void {
    this.pendingConfirm.set({ kind: 'archive-identity', id: identity.id, name: identity.statement });
  }

  askDeleteIdentity(identity: { id: string; statement: string }): void {
    this.pendingConfirm.set({ kind: 'delete-identity', id: identity.id, name: identity.statement });
  }

  cancelConfirm(): void {
    if (this.confirmBusy()) return;
    this.pendingConfirm.set(null);
  }

  confirmAction(): void {
    const action = this.pendingConfirm();
    if (!action || this.confirmBusy()) return;

    this.confirmBusy.set(true);
    const request$ =
      action.kind === 'archive-habit'
        ? this.habitService.archive(action.id)
        : action.kind === 'delete-habit'
          ? this.habitService.delete(action.id)
          : action.kind === 'archive-identity'
            ? this.identityService.archive(action.id)
            : this.identityService.delete(action.id);

    request$.subscribe({
      next: () => {
        this.confirmBusy.set(false);
        this.pendingConfirm.set(null);
        this.refreshAll();
      },
      error: () => {
        this.confirmBusy.set(false);
        this.pendingConfirm.set(null);
        this.errorMessage.set('That action could not be completed. Please try again.');
      },
    });
  }

  /** Reload the overview plus any archived data currently on screen. */
  private refreshAll(): void {
    this.loadOverview();
    this.loadArchivedIdentities();
    for (const identityId of this.expandedArchived()) {
      this.loadArchivedHabits(identityId);
    }
  }

  // --- Confirmation dialog copy ------------------------------------------------------------

  confirmTitle(): string {
    switch (this.pendingConfirm()?.kind) {
      case 'delete-habit':
        return 'Delete this habit?';
      case 'archive-habit':
        return 'Archive this habit?';
      case 'delete-identity':
        return 'Delete this identity?';
      case 'archive-identity':
        return 'Archive this identity?';
      default:
        return 'Are you sure?';
    }
  }

  confirmMessage(): string {
    const action = this.pendingConfirm();
    if (!action) return '';
    switch (action.kind) {
      case 'delete-habit':
        return `“${action.name}” and all its check-in history will be permanently deleted. This can't be undone.`;
      case 'archive-habit':
        return `“${action.name}” will be hidden from your active habits. You can restore it any time from “Show archived”.`;
      case 'delete-identity':
        return `“${action.name}”, its habits, and all their history will be permanently deleted. This can't be undone.`;
      case 'archive-identity':
        return `“${action.name}” will be hidden. You can restore it any time from “Archived identities”.`;
      default:
        return '';
    }
  }

  confirmLabel(): string {
    return this.isDangerConfirm() ? 'Delete' : 'Archive';
  }

  isDangerConfirm(): boolean {
    const kind = this.pendingConfirm()?.kind;
    return kind === 'delete-habit' || kind === 'delete-identity';
  }

  // --- Display helpers (shared with the dashboard) -----------------------------------------

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

  /** Short caption next to the stage name, e.g. "45% to next" or "fully grown". */
  growthCaption(identity: StatsIdentity): string {
    if (identity.stage >= 4) return 'fully grown';
    return `${identity.stageProgress}% to next`;
  }
}
