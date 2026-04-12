import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WalletBalance, DepositRequest, Transaction, PagedResult } from '../models/models';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/wallet`;

  private refreshSubject = new Subject<void>();
  refresh$ = this.refreshSubject.asObservable();

  triggerRefresh() {
    this.refreshSubject.next();
  }

  getBalance(): Observable<WalletBalance> {
    return this.http.get<WalletBalance>(`${this.url}/balance`);
  }

  deposit(request: DepositRequest, idempotencyKey?: string): Observable<WalletBalance> {
    const headers = idempotencyKey
      ? new HttpHeaders({ 'Idempotency-Key': idempotencyKey })
      : undefined;
    return this.http.post<WalletBalance>(`${this.url}/deposit`, request, { headers });
  }

  getTransactions(page = 1, pageSize = 20): Observable<PagedResult<Transaction>> {
    return this.http.get<PagedResult<Transaction>>(
      `${this.url}/transactions?page=${page}&pageSize=${pageSize}`
    );
  }

  getTransaction(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.url}/transactions/${id}`);
  }
}
