import { CompanionType } from './companion.model';

export interface Identity {
  id: string;
  statement: string;
  companion: CompanionType;
  isArchived: boolean;
  createdAt: string;
}
