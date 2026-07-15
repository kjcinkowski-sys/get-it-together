import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TodayIdentity } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  today(): Observable<TodayIdentity[]> {
    return this.http.get<TodayIdentity[]>(`${environment.apiUrl}/dashboard/today`);
  }
}
