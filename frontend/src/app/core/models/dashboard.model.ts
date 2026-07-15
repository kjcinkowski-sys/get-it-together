import { FrequencyType } from './habit.model';
import { HabitLogStatus } from './habit-log.model';

export interface TodayHabit {
  id: string;
  name: string;
  frequencyType: FrequencyType;
  targetPerWeek: number;
  todayStatus: HabitLogStatus | null;
}

export interface TodayIdentity {
  id: string;
  statement: string;
  habits: TodayHabit[];
}
