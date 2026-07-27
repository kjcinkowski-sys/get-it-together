import { CompanionType } from './companion.model';
import { HabitType } from './habit.model';

export interface StatsHabit {
  id: string;
  name: string;
  /** Build (good habit) or Break (bad habit). */
  type: HabitType;
  /** Weekdays this habit is scheduled on, as day numbers (0 = Sunday … 6 = Saturday). */
  scheduledDays: number[];
  /** Build: current completed-occurrence streak. Break: current clean-day streak. */
  currentStreak: number;
  /** Build: best completed-occurrence run. Break: longest clean-day run. */
  longestStreak: number;
  /** Build: all-time completed check-ins. Break: all-time slips. */
  totalCompletions: number;
  /** Build: completion rate over the last 30 days. Break: slip-free rate over the last 30 days. */
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
