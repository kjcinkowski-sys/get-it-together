import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FrequencyType, Habit } from '../models/habit.model';

@Injectable({ providedIn: 'root' })
export class HabitService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  listForIdentity(identityId: string): Observable<Habit[]> {
    return this.http.get<Habit[]>(`${this.baseUrl}/identities/${identityId}/habits`);
  }

  create(identityId: string, name: string, frequencyType: FrequencyType, targetPerWeek: number): Observable<Habit> {
    return this.http.post<Habit>(`${this.baseUrl}/identities/${identityId}/habits`, {
      name,
      frequencyType,
      targetPerWeek,
    });
  }

  update(id: string, name: string, frequencyType: FrequencyType, targetPerWeek: number): Observable<Habit> {
    return this.http.put<Habit>(`${this.baseUrl}/habits/${id}`, { name, frequencyType, targetPerWeek });
  }

  archive(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/habits/${id}/archive`, {});
  }
}
