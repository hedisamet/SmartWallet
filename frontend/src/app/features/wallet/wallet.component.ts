import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { WalletService } from '../../core/services/wallet.service';
import { WalletBalance } from '../../core/models/models';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, NgClass],
  template: `
    <div class="page">
      <div class="page-header animate-fade-in-up stagger-1">
        <div>
          <h1>My Wallet</h1>
          <p>Manage your balance and funds</p>
        </div>
        <button class="btn btn--ghost btn--sm btn--icon" (click)="refresh()" [disabled]="loading()" id="wallet-refresh-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [class.spin]="loading()" style="opacity:0.6">
            <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

      <!-- Main Wallet Card -->
      <div class="wallet-card animate-fade-in-up stagger-2">
        <div class="wallet-card__glow"></div>
        <div class="wallet-card__content">
          <div class="wallet-card__top">
            <div class="wallet-card__label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/></svg>
              VaultFlow Wallet
            </div>
            @if (wallet()?.isLocked) {
              <span class="badge badge--danger">🔒 Locked</span>
            } @else {
              <span class="badge badge--success">● Active</span>
            }
          </div>

          @if (loading()) {
            <div class="skeleton" style="width:220px;height:56px;margin:1rem 0"></div>
          } @else {
            <div class="wallet-card__balance">
              {{ wallet()?.balance | currency: wallet()?.currency ?? 'USD' : 'symbol' : '1.2-2' }}
            </div>
          }

          <div class="wallet-card__id" style="cursor: pointer;" (click)="copyId(wallet()?.walletId)" title="Click to copy">
            Wallet ID: <code id="user-wallet-id">{{ wallet()?.walletId ?? '—' }}</code>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 4px; opacity: 0.6"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </div>
        </div>

        <div class="wallet-card__chip">
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
            <rect width="40" height="30" rx="5" fill="rgba(255,255,255,0.1)"/>
            <rect x="5" y="5" width="30" height="20" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)"/>
            <line x1="5" y1="15" x2="35" y2="15" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
            <line x1="20" y1="5" x2="20" y2="25" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
          </svg>
        </div>
      </div>

      <!-- Actions -->
      <div class="wallet-actions animate-fade-in-up stagger-3">
        <a routerLink="/wallet/deposit" class="wallet-action-btn" id="wallet-deposit-btn">
          <div class="action-icon action-icon--deposit">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <span>Deposit</span>
        </a>
        <a routerLink="/transfer" class="wallet-action-btn" id="wallet-send-btn">
          <div class="action-icon action-icon--send">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </div>
          <span>Send</span>
        </a>
        <a routerLink="/transactions" class="wallet-action-btn" id="wallet-history-btn">
          <div class="action-icon action-icon--history">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/><polyline points="12 7 12 12 15 15"/></svg>
          </div>
          <span>History</span>
        </a>
      </div>

      <!-- Wallet Info -->
      <div class="wallet-info card animate-fade-in-up stagger-4">
        <h3>Wallet Details</h3>
        <div class="divider"></div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Currency</span>
            @if (loading()) {
              <div class="skeleton" style="width:60px;height:20px"></div>
            } @else {
              <span class="info-value">{{ wallet()?.currency ?? '—' }}</span>
            }
          </div>
          <div class="info-item">
            <span class="info-label">Status</span>
            @if (loading()) {
              <div class="skeleton" style="width:70px;height:20px"></div>
            } @else {
              <span class="info-value" [ngClass]="wallet()?.isLocked ? 'text-danger' : 'text-success'">
                {{ wallet()?.isLocked ? 'Locked' : 'Active' }}
              </span>
            }
          </div>
          <div class="info-item">
            <span class="info-label">Last Updated</span>
            @if (loading()) {
              <div class="skeleton" style="width:120px;height:20px"></div>
            } @else {
              <span class="info-value">{{ wallet()?.updatedAt | date:'medium' }}</span>
            }
          </div>
          <div class="info-item">
            <span class="info-label">Balance</span>
            @if (loading()) {
              <div class="skeleton" style="width:100px;height:20px"></div>
            } @else {
              <span class="info-value info-value--primary">
                {{ wallet()?.balance | currency: wallet()?.currency ?? 'USD' }}
              </span>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 720px; }

    /* Main Wallet Card — Credit card style */
    .wallet-card {
      position: relative;
      background: linear-gradient(135deg, #1a0f5c 0%, #0f1f4d 50%, #0a2440 100%);
      border: 1px solid rgba(108,99,255,0.3);
      border-radius: 1.5rem;
      padding: 2rem;
      margin-bottom: 1.5rem;
      overflow: hidden;
      aspect-ratio: 1.75 / 1;
      max-height: 260px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), var(--shadow-glow);
    }
    .wallet-card__glow {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 30% 20%, rgba(108,99,255,0.35) 0%, transparent 60%),
                  radial-gradient(ellipse at 80% 80%, rgba(0,212,170,0.15) 0%, transparent 50%);
    }
    .wallet-card__content { z-index: 1; flex: 1; }
    .wallet-card__top {
      display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;
    }
    .wallet-card__label {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: var(--font-size-xs); color: rgba(255,255,255,0.6);
      font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase;
    }
    .wallet-card__balance {
      font-size: 2.5rem; font-weight: 800; letter-spacing: -0.04em; color: #fff; margin-bottom: 0.5rem;
    }
    .wallet-card__id {
      font-size: var(--font-size-xs); color: rgba(255,255,255,0.4);
      code { color: rgba(255,255,255,0.6); font-family: monospace; font-size: 0.7rem; }
    }
    .wallet-card__chip { z-index: 1; }

    /* Actions */
    .wallet-actions {
      display: flex; gap: 1rem; margin-bottom: 2rem;
    }
    .wallet-action-btn {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
      padding: 1.5rem 1rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-xl);
      color: var(--color-text-muted);
      font-size: var(--font-size-sm); font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-fast);
      text-align: center;
      &:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-light); transform: translateY(-2px); }
    }
    .action-icon {
      width: 52px; height: 52px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center; color: #fff;
      &--deposit  { background: linear-gradient(135deg,#6C63FF,#8B85FF); }
      &--send     { background: linear-gradient(135deg,#00D4AA,#00B894); }
      &--history  { background: linear-gradient(135deg,#60A5FA,#3B82F6); }
    }

    /* Info grid */
    .wallet-info h3 { font-size: var(--font-size-md); margin-bottom: 0; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.3rem; }
    .info-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
    .info-value { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text);
      &--primary { color: var(--color-primary); font-size: var(--font-size-md); }
    }
    .text-success { color: var(--color-success); }
    .text-danger  { color: var(--color-danger);  }

    @media (max-width: 480px) {
      .wallet-card { aspect-ratio: auto; max-height: none; }
      .wallet-card__balance { font-size: 1.75rem; }
      .wallet-actions { flex-wrap: wrap; }
      .info-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class WalletComponent implements OnInit {
  private walletSvc = inject(WalletService);
  wallet  = signal<WalletBalance | null>(null);
  loading = signal(true);

  private notify = inject(NotificationService);

  copyId(id: string | null | undefined) {
    if (!id) return;
    navigator.clipboard.writeText(id);
    this.notify.success('Copied', 'Wallet ID copied to clipboard');
  }

  ngOnInit(): void {
    this.refresh();
    this.walletSvc.refresh$.subscribe(() => this.refresh());
  }

  refresh(): void {
    this.loading.set(true);
    this.walletSvc.getBalance().subscribe({
      next: b => { this.wallet.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
