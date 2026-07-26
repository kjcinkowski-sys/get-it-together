import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TodayIdentity } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  /**
   * The dashboard for a given day. Omit `date` (or pass today) for the live view; pass a
   * past `YYYY-MM-DD` to review that day. Future dates are clamped to today server-side.
   */
  forDate(date?: string): Observable<TodayIdentity[]> {
    const options = date ? { params: { date } } : {};
    return this.http.get<TodayIdentity[]>(`${environment.apiUrl}/dashboard/today`, options);
  }
}
