export type FrequencyType = 'Daily' | 'TimesPerWeek' | 'Weekly';

export interface Habit {
  id: string;
  identityId: string;
  name: string;
  frequencyType: FrequencyType;
  targetPerWeek: number;
  /** Weekdays this habit is scheduled on, as day numbers (0 = Sunday … 6 = Saturday). */
  scheduledDays: number[];
  isArchived: boolean;
  createdAt: string;
}
