export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  timeZone?: string | null;
}

export interface Profile extends User {
  createdAt: string;
  updatedAt?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}
