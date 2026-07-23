import { CompanionType } from './companion.model';
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
  /** The companion chosen for this identity. */
  companion: CompanionType;
  /** Consistency strength 0–100, derived from recent habit history. */
  strength: number;
  /** Companion-creature growth stage 0–4. */
  stage: number;
  /** Human-readable stage name (e.g. "Sprout"). */
  stageName: string;
  habits: TodayHabit[];
}
