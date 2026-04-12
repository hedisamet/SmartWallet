import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { TransferService }    from '../../../core/services/transfer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TransferRequest }    from '../../../core/models/models';
import { WalletService }       from '../../../core/services/wallet.service';

@Component({
  selector: 'app-confirm-transfer',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="page">
      <div class="page-nav animate-fade-in-up stagger-1">
        <a routerLink="/transfer" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Send Money
        </a>
      </div>

      <div class="page-header animate-fade-in-up stagger-2">
        <h1>Confirm Transfer</h1>
        <p>Review the details before sending</p>
      </div>

      @if (!transfer) {
        <div class="empty-state card">
          <p>No transfer data found. Please go back and fill the form.</p>
          <a routerLink="/transfer" class="btn btn--primary">Start Over</a>
        </div>
      } @else {

        @if (!success()) {
          <!-- Confirmation Card -->
          <div class="confirm-card card animate-fade-in-up stagger-3">
            <div class="confirm-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>

            <div class="confirm-amount">
              {{ transfer.amount | currency: transfer.currency }}
            </div>
            <p class="confirm-subtitle">will be sent to</p>

            <div class="confirm-details">
              <div class="detail-row">
                <span class="detail-label">Recipient ID</span>
                <span class="detail-value">
                  <code>{{ transfer.receiverWalletId }}</code>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount</span>
                <span class="detail-value amount-highlight">{{ transfer.amount | currency: transfer.currency }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Currency</span>
                <span class="detail-value">{{ transfer.currency }}</span>
              </div>
              @if (transfer.description) {
                <div class="detail-row">
                  <span class="detail-label">Note</span>
                  <span class="detail-value">{{ transfer.description }}</span>
                </div>
              }
              <div class="detail-row">
                <span class="detail-label">Fee</span>
                <span class="detail-value" style="color:var(--color-success)">Free</span>
              </div>
            </div>

            <div class="warning-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
              <span>Transfers are instant and <strong>cannot be reversed</strong>. Please verify the recipient.</span>
            </div>

            <div class="confirm-actions">
              <a routerLink="/transfer" class="btn btn--outline" id="cancel-transfer">Cancel</a>
              <button class="btn btn--primary" id="confirm-transfer-btn" (click)="onConfirm()" [disabled]="loading()">
                @if (loading()) {
                  <span class="spinner"></span> Sending…
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Confirm & Send
                }
              </button>
            </div>
          </div>
        } @else {
          <!-- Success State -->
          <div class="success-card card animate-fade-in-up">
            <div class="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h2>Transfer Successful!</h2>
            <p>{{ transfer.amount | currency: transfer.currency }} has been sent.</p>
            <div class="success-actions">
              <a routerLink="/transactions" class="btn btn--outline" id="view-transaction">View Transactions</a>
              <a routerLink="/dashboard" class="btn btn--primary" id="back-to-dashboard">Back to Dashboard</a>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 560px; }
    .page-nav { margin-bottom: 1.5rem; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--color-text-muted); font-size: var(--font-size-sm); font-weight: 500; text-decoration: none; transition: color var(--transition-fast); &:hover { color: var(--color-primary); } }

    .confirm-card { display: flex; flex-direction: column; align-items: center; padding: 2.5rem; text-align: center; }
    .confirm-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--color-primary-light); color: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1rem;
    }
    .confirm-amount { font-size: 2.5rem; font-weight: 800; letter-spacing: -0.04em; color: var(--color-text); }
    .confirm-subtitle { color: var(--color-text-muted); margin-bottom: 1.5rem; }

    .confirm-details {
      width: 100%; background: var(--color-surface-2); border-radius: var(--radius-lg);
      padding: 1rem; margin-bottom: 1.5rem;
      display: flex; flex-direction: column; gap: 0;
    }
    .detail-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.75rem 0.5rem; border-bottom: 1px solid var(--color-border-soft);
      &:last-child { border-bottom: none; }
    }
    .detail-label { font-size: var(--font-size-sm); color: var(--color-text-muted); }
    .detail-value { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); text-align: right; word-break: break-all;
      code { font-size: 0.7rem; color: var(--color-text-muted); }
    }
    .amount-highlight { color: var(--color-primary); font-size: var(--font-size-md); }

    .warning-box {
      display: flex; align-items: flex-start; gap: 0.5rem; width: 100%;
      background: var(--color-warning-bg); border: 1px solid rgba(255,181,71,0.2);
      border-radius: var(--radius-md); padding: 0.75rem 1rem;
      font-size: var(--font-size-xs); color: var(--color-warning); text-align: left;
      margin-bottom: 1.5rem;
      strong { color: var(--color-warning); }
    }
    .confirm-actions { display: flex; gap: 1rem; width: 100%; }
    .confirm-actions .btn { flex: 1; }

    /* Success */
    .success-card { display: flex; flex-direction: column; align-items: center; padding: 3rem; text-align: center; gap: 1rem; }
    .success-icon { width: 88px; height: 88px; border-radius: 50%; background: var(--color-success-bg); display: flex; align-items: center; justify-content: center; animation: pulse-glow 2s ease-in-out infinite; }
    .success-card h2 { font-size: var(--font-size-2xl); }
    .success-actions { display: flex; gap: 1rem; margin-top: 1rem; }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 2rem; text-align: center; }
    .spinner { width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block; }
  `]
})
export class ConfirmTransferComponent implements OnInit {
  private transferSvc = inject(TransferService);
  private walletSvc   = inject(WalletService);
  private notify      = inject(NotificationService);
  private router      = inject(Router);

  transfer: TransferRequest | null = null;
  loading  = signal(false);
  success  = signal(false);

  ngOnInit(): void {
    const state = this.router.getCurrentNavigation()?.extras.state ?? history.state;
    this.transfer = (state as any)?.transfer ?? null;
    if (!this.transfer) {
      // If accessed directly without state, redirect
      setTimeout(() => this.router.navigate(['/transfer']), 100);
    }
  }

  onConfirm(): void {
    if (!this.transfer) return;
    this.loading.set(true);
    const idempotencyKey = crypto.randomUUID();
    this.transferSvc.send(this.transfer, idempotencyKey).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        this.walletSvc.triggerRefresh();
        this.notify.success('Transfer complete! 🚀', 'Funds sent successfully.');
      },
      error: () => this.loading.set(false),
    });
  }
}
