import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StatsIdentity } from '../models/stats.model';

@Injectable({ providedIn: 'root' })
export class StatsService {
  constructor(private readonly http: HttpClient) {}

  overview(): Observable<StatsIdentity[]> {
    return this.http.get<StatsIdentity[]>(`${environment.apiUrl}/stats`);
  }
}
