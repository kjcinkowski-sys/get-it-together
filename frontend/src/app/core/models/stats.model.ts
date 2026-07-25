import { CompanionType } from './companion.model';

export interface StatsHabit {
  id: string;
  name: string;
  /** Weekdays this habit is scheduled on, as day numbers (0 = Sunday … 6 = Saturday). */
  scheduledDays: number[];
  /** Consecutive completed scheduled occurrences up to today. */
  currentStreak: number;
  /** Best run of consecutive completed occurrences on record. */
  longestStreak: number;
  /** All-time count of completed check-ins. */
  totalCompletions: number;
  /** Percentage of due scheduled occurrences completed over the last 30 days. */
  completionRate: number;
}

export interface StatsIdentity {
  id: string;
  statement: string;
  companion: CompanionType;
  /** Companion-creature growth stage 0–4. */
  stage: number;
  stageName: string;
  /** Progress 0–100 through the current stage toward the next. */
  stageProgress: number;
  /** Length in days of the identity's best current streak. */
  streakDays: number;
  habits: StatsHabit[];
}
