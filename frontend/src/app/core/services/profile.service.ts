import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Profile } from '../models/user.model';

export interface UpdateProfilePayload {
  displayName: string;
  email: string;
  timeZone: string | null;
  /** null keeps the current picture, '' clears it, a data URL sets a new one. */
  avatarUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly baseUrl = `${environment.apiUrl}/profile`;

  constructor(private readonly http: HttpClient) {}

  get(): Observable<Profile> {
    return this.http.get<Profile>(this.baseUrl);
  }

  update(payload: UpdateProfilePayload): Observable<Profile> {
    return this.http.put<Profile>(this.baseUrl, payload);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/password`, { currentPassword, newPassword });
  }
}
