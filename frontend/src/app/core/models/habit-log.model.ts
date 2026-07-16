export type HabitLogStatus = 'Completed' | 'Partial' | 'Missed';

export interface HabitLog {
  id: string;
  habitId: string;
  completedOn: string;
  status: HabitLogStatus;
  note: string | null;
}
