export interface Habit {
  id: string;
  identityId: string;
  name: string;
  /** Weekdays this habit is scheduled on, as day numbers (0 = Sunday … 6 = Saturday). */
  scheduledDays: number[];
  isArchived: boolean;
  createdAt: string;
}
