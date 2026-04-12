import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { WalletService } from '../../../core/services/wallet.service';
import { Transaction } from '../../../core/models/models';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, NgClass, SafeHtmlPipe],
  template: `
    <div class="page">
      <div class="page-nav animate-fade-in-up stagger-1">
        <a routerLink="/transactions" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Transactions
        </a>
      </div>

      @if (loading()) {
        <div class="detail-skeleton">
          <div class="skeleton" style="width:80px;height:80px;border-radius:50%;margin:0 auto 1rem"></div>
          <div class="skeleton" style="width:160px;height:36px;margin:0 auto 0.5rem"></div>
          <div class="skeleton" style="width:100px;height:20px;margin:0 auto 2rem"></div>
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton" style="height:48px;margin-bottom:0.5rem;border-radius:8px"></div>
          }
        </div>
      } @else if (!tx()) {
        <div class="empty-state card" style="max-width:500px;margin:0 auto">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          <h3>Transaction not found</h3>
          <p>This transaction may not exist or you may not have access.</p>
          <a routerLink="/transactions" class="btn btn--primary">Go to Transactions</a>
        </div>
      } @else {
        <div class="detail-card card animate-fade-in-up stagger-2">
          <!-- Icon & Amount -->
          <div class="detail-hero">
            <div class="tx-hero-icon" [ngClass]="'tx-hero-icon--' + tx()!.type.toLowerCase()">
              <span [innerHTML]="getTxIcon(tx()!.type) | safeHtml"></span>
            </div>
            <div class="detail-amount" [ngClass]="tx()!.type === 'Deposit' ? 'credit' : 'debit'">
              {{ tx()!.type === 'Deposit' ? '+' : '-' }}{{ tx()!.amount | currency: tx()!.currency }}
            </div>
            <div class="detail-type">{{ tx()!.type }}</div>
            <span class="badge" [ngClass]="getStatusClass(tx()!.status)">{{ tx()!.status }}</span>
          </div>

          <div class="divider"></div>

          <!-- Details Grid -->
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Transaction ID</span>
              <code class="detail-code">{{ tx()!.id }}</code>
            </div>
            <div class="detail-item">
              <span class="detail-label">Idempotency Key</span>
              <code class="detail-code">{{ tx()!.idempotencyKey }}</code>
            </div>
            <div class="detail-item">
              <span class="detail-label">Sender Wallet</span>
              <code class="detail-code">{{ tx()!.senderWalletId }}</code>
            </div>
            <div class="detail-item">
              <span class="detail-label">Receiver Wallet</span>
              <code class="detail-code">{{ tx()!.receiverWalletId }}</code>
            </div>
            <div class="detail-item">
              <span class="detail-label">Amount</span>
              <span class="detail-value">{{ tx()!.amount | currency: tx()!.currency }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Currency</span>
              <span class="detail-value">{{ tx()!.currency }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Created At</span>
              <span class="detail-value">{{ tx()!.createdAt | date:'full' }}</span>
            </div>
            @if (tx()!.completedAt) {
              <div class="detail-item">
                <span class="detail-label">Completed At</span>
                <span class="detail-value">{{ tx()!.completedAt | date:'full' }}</span>
              </div>
            }
            @if (tx()!.description) {
              <div class="detail-item">
                <span class="detail-label">Note</span>
                <span class="detail-value">{{ tx()!.description }}</span>
              </div>
            }
            @if (tx()!.failureReason) {
              <div class="detail-item">
                <span class="detail-label">Failure Reason</span>
                <span class="detail-value" style="color:var(--color-danger)">{{ tx()!.failureReason }}</span>
              </div>
            }
          </div>

          <div class="detail-actions">
            <a routerLink="/transactions" class="btn btn--outline" id="back-to-txs">All Transactions</a>
            <a routerLink="/transfer" class="btn btn--primary" id="new-transfer">New Transfer</a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 700px; }
    .page-nav { margin-bottom: 1.5rem; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--color-text-muted); font-size: var(--font-size-sm); font-weight: 500; text-decoration: none; transition: color var(--transition-fast); &:hover { color: var(--color-primary); } }

    .detail-card { padding: 2.5rem; }
    .detail-hero { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; text-align: center; }
    .tx-hero-icon {
      width: 80px; height: 80px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      &--transfer   { background: var(--color-primary-light); color: var(--color-primary); }
      &--deposit    { background: var(--color-success-bg);    color: var(--color-success); }
      &--withdrawal { background: var(--color-warning-bg);    color: var(--color-warning); }
    }
    .detail-amount { font-size: 2.5rem; font-weight: 800; letter-spacing: -0.04em;
      &.credit { color: var(--color-success); }
      &.debit  { color: var(--color-text); }
    }
    .detail-type { font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: 500; }

    .detail-grid { display: flex; flex-direction: column; gap: 0; margin: 1.5rem 0; }
    .detail-item {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; padding: 0.875rem 0.5rem;
      border-bottom: 1px solid var(--color-border-soft);
      &:last-child { border-bottom: none; }
    }
    .detail-label { font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: 500; white-space: nowrap; flex-shrink: 0; }
    .detail-value { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); text-align: right; }
    .detail-code { font-size: 0.7rem; color: var(--color-text-muted); font-family: monospace; word-break: break-all; text-align: right; }

    .detail-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }

    .detail-skeleton { max-width: 500px; margin: 0 auto; padding: 2rem; background: var(--color-surface); border-radius: var(--radius-xl); border: 1px solid var(--color-border-soft); }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; text-align: center; h3 { font-size: var(--font-size-lg); } }
  `]
})
export class TransactionDetailComponent implements OnInit {
  @Input() id!: string;

  private walletSvc = inject(WalletService);
  tx      = signal<Transaction | null>(null);
  loading = signal(true);

  getTxIcon(type: string): string {
    const icons: Record<string, string> = {
      Transfer:   '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
      Deposit:    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
      Withdrawal: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    };
    return icons[type] ?? icons['Transfer'];
  }

  getStatusClass(s: string): string {
    return { Success: 'badge--success', Failed: 'badge--danger', Pending: 'badge--warning' }[s] ?? 'badge--neutral';
  }

  ngOnInit(): void {
    this.walletSvc.getTransaction(this.id).subscribe({
      next: t => {
        this.tx.set(t);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
