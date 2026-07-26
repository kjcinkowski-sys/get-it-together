import { CompanionType } from './companion.model';

export interface Identity {
  id: string;
  statement: string;
  companion: CompanionType;
  companionName: string | null;
  isArchived: boolean;
  createdAt: string;
}
