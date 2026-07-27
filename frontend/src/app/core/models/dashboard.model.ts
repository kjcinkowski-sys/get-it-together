import { CompanionType } from './companion.model';
import { HabitLogStatus } from './habit-log.model';
import { HabitType } from './habit.model';

export interface TodayHabit {
  id: string;
  name: string;
  /** Build (good habit) or Break (bad habit). */
  type: HabitType;
  /** Weekdays this habit is scheduled on, as day numbers (0 = Sunday … 6 = Saturday). */
  scheduledDays: number[];
  /**
   * For a build habit, consecutive completed scheduled occurrences up to the viewed day.
   * For a break habit, the number of full clean days (no slip) before the viewed day — the
   * in-progress day itself doesn't count until it's over.
   */
  currentStreak: number;
  /** The habit's check-in status on the viewed day, if any. `Slipped` marks a break-habit slip. */
  status: HabitLogStatus | null;
}

export interface TodayIdentity {
  id: string;
  statement: string;
  /** The companion chosen for this identity. */
  companion: CompanionType;
  /** Optional user-given name for the companion. */
  companionName: string | null;
  /** Companion-creature growth stage 0–4. */
  stage: number;
  /** Human-readable stage name (e.g. "Sprout"). */
  stageName: string;
  /** Progress 0–100 through the current stage toward the next. */
  stageProgress: number;
  /** Length in days of the identity's best current streak. */
  streakDays: number;
  habits: TodayHabit[];
}
