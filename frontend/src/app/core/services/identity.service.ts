import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompanionType } from '../models/companion.model';
import { Identity } from '../models/identity.model';

@Injectable({ providedIn: 'root' })
export class IdentityService {
  private readonly baseUrl = `${environment.apiUrl}/identities`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Identity[]> {
    return this.http.get<Identity[]>(this.baseUrl);
  }

  create(statement: string, companion: CompanionType): Observable<Identity> {
    return this.http.post<Identity>(this.baseUrl, { statement, companion });
  }

  update(id: string, statement: string, companion?: CompanionType): Observable<Identity> {
    return this.http.put<Identity>(`${this.baseUrl}/${id}`, { statement, companion });
  }

  archive(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/archive`, {});
  }
}
