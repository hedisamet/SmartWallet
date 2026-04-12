import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { WalletService } from '../../../core/services/wallet.service';
import { Transaction, PagedResult } from '../../../core/models/models';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, NgClass, SafeHtmlPipe],
  template: `
    <div class="page">
      <div class="page-header animate-fade-in-up stagger-1">
        <div>
          <h1>Transaction History</h1>
          <p>All your financial activity in one place</p>
        </div>
        <button class="btn btn--ghost btn--sm btn--icon" (click)="load()" [disabled]="loading()" id="tx-history-refresh-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [class.spin]="loading()" style="opacity:0.6">
            <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

      <!-- Filters -->
      <div class="filters card animate-fade-in-up stagger-2">
        <div class="filter-group">
          <label class="filter-label">Filter by type</label>
          <div class="filter-chips">
            @for (f of filterOptions; track f.value) {
              <button class="filter-chip" [class.active]="activeFilter() === f.value"
                (click)="setFilter(f.value)" [id]="'filter-' + f.value">
                {{ f.label }}
              </button>
            }
          </div>
        </div>
        <div class="filter-group">
          <label class="filter-label">Filter by status</label>
          <div class="filter-chips">
            @for (s of statusOptions; track s.value) {
              <button class="filter-chip" [class.active]="activeStatus() === s.value"
                (click)="setStatus(s.value)" [id]="'status-' + s.value">
                {{ s.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="animate-fade-in-up stagger-3">
        @if (loading()) {
          <div class="tx-skeleton-list">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="tx-skeleton-row card">
                <div class="skeleton" style="width:40px;height:40px;border-radius:50%"></div>
                <div style="flex:1;display:flex;flex-direction:column;gap:6px">
                  <div class="skeleton" style="width:160px;height:14px"></div>
                  <div class="skeleton" style="width:100px;height:12px"></div>
                </div>
                <div class="skeleton" style="width:90px;height:20px"></div>
                <div class="skeleton" style="width:70px;height:22px;border-radius:999px"></div>
              </div>
            }
          </div>
        } @else if (!filteredTx().length) {
          <div class="empty-state card">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.25"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <h3>No transactions found</h3>
            <p>Try changing the filter or make your first deposit</p>
            <a routerLink="/wallet/deposit" class="btn btn--primary">Deposit Funds</a>
          </div>
        } @else {
          <div class="table-wrapper">
            <table aria-label="Transaction history">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (tx of filteredTx(); track tx.id) {
                  <tr>
                    <td>
                      <div class="tx-cell">
                        <div class="tx-icon" [ngClass]="'tx-icon--' + tx.type.toLowerCase()">
                          <span [innerHTML]="getTxIcon(tx.type) | safeHtml"></span>
                        </div>
                        <div>
                          <div class="tx-type">{{ tx.type }}</div>
                          <div class="tx-account">
                            @if (tx.type === 'Deposit') {
                              From: {{ tx.senderName ?? 'System' }}
                            } @else if (tx.type === 'Transfer') {
                              To: {{ tx.receiverName ?? 'User' }}
                            } @else {
                              {{ tx.id.slice(0,8) }}…
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="tx-date-col">
                        <span>{{ tx.createdAt | date:'MMM d, y' }}</span>
                        <span class="tx-time">{{ tx.createdAt | date:'h:mm a' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="tx-amount-cell" [ngClass]="tx.type === 'Deposit' ? 'credit' : 'debit'">
                        {{ tx.type === 'Deposit' ? '+' : '-' }}{{ tx.amount | currency: tx.currency }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getStatusClass(tx.status)">{{ tx.status }}</span>
                    </td>
                    <td>
                      <a [routerLink]="['/transactions', tx.id]" class="btn btn--ghost btn--sm" [id]="'view-tx-' + tx.id.slice(0,8)">
                        Details
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (result()?.totalPages && result()!.totalPages > 1) {
            <div class="pagination">
              <button class="btn btn--outline btn--sm" (click)="prevPage()" [disabled]="currentPage() === 1" id="prev-page">← Prev</button>
              <span class="pagination-info">Page {{ currentPage() }} of {{ result()?.totalPages }}</span>
              <button class="btn btn--outline btn--sm" (click)="nextPage()" [disabled]="currentPage() >= (result()?.totalPages ?? 1)" id="next-page">Next →</button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; }

    /* Filters */
    .filters { display: flex; gap: 2rem; flex-wrap: wrap; margin-bottom: 1.5rem; padding: 1rem 1.5rem; }
    .filter-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .filter-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
    .filter-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .filter-chip {
      padding: 0.3rem 0.875rem; border-radius: var(--radius-full);
      border: 1px solid var(--color-border-soft);
      background: transparent; color: var(--color-text-muted);
      font-size: var(--font-size-xs); font-weight: 500; cursor: pointer;
      transition: all var(--transition-fast);
      &:hover { border-color: var(--color-primary); color: var(--color-primary); }
      &.active { background: var(--color-primary-light); border-color: var(--color-primary); color: var(--color-primary); font-weight: 600; }
    }

    /* Tx cell */
    .tx-cell { display: flex; align-items: center; gap: 0.75rem; }
    .tx-icon {
      width: 38px; height: 38px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      &--transfer   { background: var(--color-primary-light); color: var(--color-primary); }
      &--deposit    { background: var(--color-success-bg);    color: var(--color-success); }
      &--withdrawal { background: var(--color-warning-bg);    color: var(--color-warning); }
    }
    .tx-type { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); }
    .tx-account { font-size: var(--font-size-xs); color: var(--color-text-faint); font-weight: 500; }
    .tx-id   { font-size: var(--font-size-xs); color: var(--color-text-faint); font-family: monospace; }
    .tx-date-col { display: flex; flex-direction: column; font-size: var(--font-size-sm); color: var(--color-text); }
    .tx-time { font-size: var(--font-size-xs); color: var(--color-text-muted); }
    .tx-amount-cell { font-size: var(--font-size-sm); font-weight: 700;
      &.credit { color: var(--color-success); }
      &.debit  { color: var(--color-text); }
    }

    /* Skeleton */
    .tx-skeleton-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .tx-skeleton-row { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; }

    /* Empty */
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; text-align: center;
      h3 { font-size: var(--font-size-lg); }
      p { color: var(--color-text-muted); }
    }

    /* Pagination */
    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; }
    .pagination-info { font-size: var(--font-size-sm); color: var(--color-text-muted); }
  `]
})
export class TransactionListComponent implements OnInit {
  private walletSvc = inject(WalletService);

  result      = signal<PagedResult<Transaction> | null>(null);
  loading     = signal(true);
  currentPage = signal(1);
  activeFilter = signal('all');
  activeStatus = signal('all');

  filterOptions = [
    { label: 'All',        value: 'all' },
    { label: 'Transfers',  value: 'Transfer' },
    { label: 'Deposits',   value: 'Deposit' },
    { label: 'Withdrawals',value: 'Withdrawal' },
  ];

  statusOptions = [
    { label: 'All',     value: 'all' },
    { label: 'Success', value: 'Success' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Failed',  value: 'Failed' },
  ];

  filteredTx() {
    let items = this.result()?.items ?? [];
    if (this.activeFilter() !== 'all') items = items.filter(t => t.type === this.activeFilter());
    if (this.activeStatus() !== 'all') items = items.filter(t => t.status === this.activeStatus());
    return items;
  }

  setFilter(v: string): void { this.activeFilter.set(v); }
  setStatus(v: string): void { this.activeStatus.set(v); }

  getTxIcon(type: string): string {
    const icons: Record<string, string> = {
      Transfer:   '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
      Deposit:    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
      Withdrawal: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    };
    return icons[type] ?? icons['Transfer'];
  }

  getStatusClass(s: string): string {
    return { Success: 'badge--success', Failed: 'badge--danger', Pending: 'badge--warning' }[s] ?? 'badge--neutral';
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.walletSvc.getTransactions(this.currentPage(), 20).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  prevPage(): void { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.load(); } }
  nextPage(): void {
    if (this.currentPage() < (this.result()?.totalPages ?? 1)) {
      this.currentPage.update(p => p + 1);
      this.load();
    }
  }
}
