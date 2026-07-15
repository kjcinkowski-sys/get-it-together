export type FrequencyType = 'Daily' | 'TimesPerWeek' | 'Weekly';

export interface Habit {
  id: string;
  identityId: string;
  name: string;
  frequencyType: FrequencyType;
  targetPerWeek: number;
  isArchived: boolean;
  createdAt: string;
}
