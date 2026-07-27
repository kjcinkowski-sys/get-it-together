import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Habit, HabitType } from '../models/habit.model';

@Injectable({ providedIn: 'root' })
export class HabitService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  listForIdentity(identityId: string): Observable<Habit[]> {
    return this.http.get<Habit[]>(`${this.baseUrl}/identities/${identityId}/habits`);
  }

  listArchived(identityId: string): Observable<Habit[]> {
    return this.http.get<Habit[]>(`${this.baseUrl}/identities/${identityId}/habits/archived`);
  }

  get(id: string): Observable<Habit> {
    return this.http.get<Habit>(`${this.baseUrl}/habits/${id}`);
  }

  create(
    identityId: string,
    name: string,
    scheduledDays: number[],
    type: HabitType = 'Build',
  ): Observable<Habit> {
    return this.http.post<Habit>(`${this.baseUrl}/identities/${identityId}/habits`, {
      name,
      scheduledDays,
      type,
    });
  }

  update(
    id: string,
    name: string,
    scheduledDays: number[],
    type: HabitType = 'Build',
  ): Observable<Habit> {
    return this.http.put<Habit>(`${this.baseUrl}/habits/${id}`, { name, scheduledDays, type });
  }

  archive(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/habits/${id}/archive`, {});
  }

  restore(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/habits/${id}/restore`, {});
  }

  /** Permanent hard delete — the habit and its logs are gone for good. */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/habits/${id}`);
  }
}
