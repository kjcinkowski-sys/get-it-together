/** Whether a habit is one to build (a good habit) or one to break (a bad habit). */
export type HabitType = 'Build' | 'Break';

export interface Habit {
  id: string;
  identityId: string;
  name: string;
  /** Build (good habit) or Break (bad habit). */
  type: HabitType;
  /** Weekdays this habit is scheduled on, as day numbers (0 = Sunday … 6 = Saturday). */
  scheduledDays: number[];
  isArchived: boolean;
  createdAt: string;
}
