import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HabitLog, HabitLogStatus } from '../models/habit-log.model';

@Injectable({ providedIn: 'root' })
export class HabitLogService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  checkIn(habitId: string, date: string, status: HabitLogStatus, note?: string): Observable<HabitLog> {
    return this.http.put<HabitLog>(`${this.baseUrl}/habits/${habitId}/logs/${date}`, {
      status,
      note: note ?? null,
    });
  }

  history(habitId: string, from?: string, to?: string): Observable<HabitLog[]> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.http.get<HabitLog[]>(`${this.baseUrl}/habits/${habitId}/logs`, { params });
  }
}
