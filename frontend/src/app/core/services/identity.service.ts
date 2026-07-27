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

  listArchived(): Observable<Identity[]> {
    return this.http.get<Identity[]>(`${this.baseUrl}/archived`);
  }

  create(statement: string, companion: CompanionType, companionName?: string | null): Observable<Identity> {
    return this.http.post<Identity>(this.baseUrl, { statement, companion, companionName });
  }

  update(
    id: string,
    statement: string,
    companion?: CompanionType,
    companionName?: string | null,
  ): Observable<Identity> {
    return this.http.put<Identity>(`${this.baseUrl}/${id}`, { statement, companion, companionName });
  }

  archive(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/archive`, {});
  }

  restore(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/restore`, {});
  }

  /** Permanent hard delete — the identity, its habits, and their logs are gone for good. */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
