/** The kind of companion a user picked to represent an identity's progress. */
export type CompanionType = 'Sprite' | 'Tree' | 'Cat' | 'Butterfly';

export interface CompanionOption {
  type: CompanionType;
  label: string;
}

/** Companions offered in the identity picker. `Sprite` is legacy back-compat only. */
export const COMPANION_OPTIONS: CompanionOption[] = [
  { type: 'Tree', label: 'Tree' },
  { type: 'Cat', label: 'Cat' },
  { type: 'Butterfly', label: 'Butterfly' },
];
