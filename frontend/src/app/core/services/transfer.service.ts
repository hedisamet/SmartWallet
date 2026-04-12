import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TransferRequest, TransferResult } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TransferService {
  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/transfers`;

  send(request: TransferRequest, idempotencyKey?: string): Observable<TransferResult> {
    const headers = idempotencyKey
      ? new HttpHeaders({ 'Idempotency-Key': idempotencyKey })
      : undefined;
    return this.http.post<TransferResult>(this.url, request, { headers });
  }
}
