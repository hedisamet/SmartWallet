import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { WalletService } from '../../core/services/wallet.service';
import { AuthService }   from '../../core/services/auth.service';
import { WalletBalance, Transaction } from '../../core/models/models';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, NgClass, SafeHtmlPipe],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header animate-fade-in-up stagger-1">
        <div>
          <h1>Good {{ greeting() }}, {{ firstName() }} 👋</h1>
          <p>Here's your financial overview</p>
        </div>
        <button class="btn btn--ghost btn--sm btn--icon" (click)="refresh()" [disabled]="refreshing()" id="dashboard-refresh-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [class.spin]="refreshing()" style="opacity:0.6">
            <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

      <!-- Balance Hero Card -->
      <div class="balance-hero animate-fade-in-up stagger-2">
        <div class="balance-hero__bg"></div>
        <div class="balance-hero__content">
          <div class="balance-hero__label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/></svg>
            Total Balance
          </div>
          @if (loadingBalance()) {
            <div class="skeleton" style="width:200px;height:48px;margin:0.5rem 0"></div>
          } @else {
            <div class="balance-hero__amount">
              {{ balance()?.balance | currency: balance()?.currency ?? 'USD' }}
            </div>
          }
          <div class="balance-hero__meta">
            @if (balance()?.isLocked) {
              <span class="badge badge--danger">🔒 Locked</span>
            } @else {
              <span class="badge badge--success">● Active</span>
            }
            <span class="balance-hero__updated">Updated just now</span>
          </div>
        </div>
        <div class="balance-hero__actions">
          <a routerLink="/wallet/deposit" class="btn btn--accent" id="dashboard-deposit-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Deposit
          </a>
          <a routerLink="/transfer" class="btn btn--outline" id="dashboard-send-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send
          </a>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-grid animate-fade-in-up stagger-3">
        @for (stat of stats(); track stat.label) {
          <div class="stat-card card">
            <div class="stat-icon" [style.background]="stat.bg">
              <span [innerHTML]="stat.icon | safeHtml"></span>
            </div>
            <div class="stat-info">
              <span class="stat-label">{{ stat.label }}</span>
              @if (loadingBalance()) {
                <div class="skeleton" style="width:80px;height:24px"></div>
              } @else {
                <span class="stat-value">{{ stat.value }}</span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Quick Actions -->
      <div class="section animate-fade-in-up stagger-4">
        <h2 class="section-title">Quick Actions</h2>
        <div class="quick-actions">
          @for (action of quickActions; track action.label) {
            <a [routerLink]="action.route" class="quick-action-card">
              <div class="quick-action-icon" [style.background]="action.bg">
                <span [innerHTML]="action.icon | safeHtml"></span>
              </div>
              <span class="quick-action-label">{{ action.label }}</span>
            </a>
          }
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="section animate-fade-in-up stagger-5">
        <div class="section-header">
          <h2 class="section-title">Recent Transactions</h2>
          <a routerLink="/transactions" class="btn btn--ghost btn--sm" id="view-all-transactions">View all</a>
        </div>

        @if (loadingTx()) {
          <div class="tx-skeleton">
            @for (i of [1,2,3]; track i) {
              <div class="tx-skeleton-row">
                <div class="skeleton" style="width:40px;height:40px;border-radius:50%"></div>
                <div style="flex:1;display:flex;flex-direction:column;gap:6px">
                  <div class="skeleton" style="width:140px;height:14px"></div>
                  <div class="skeleton" style="width:80px;height:12px"></div>
                </div>
                <div class="skeleton" style="width:70px;height:18px"></div>
              </div>
            }
          </div>
        } @else if (!recentTx().length) {
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>No transactions yet</p>
            <a routerLink="/wallet/deposit" class="btn btn--primary btn--sm">Make your first deposit</a>
          </div>
        } @else {
          <div class="tx-list card" style="padding:0">
            @for (tx of recentTx(); track tx.id) {
              <a [routerLink]="['/transactions', tx.id]" class="tx-row">
                <div class="tx-icon" [ngClass]="'tx-icon--' + tx.type.toLowerCase()">
                  <span [innerHTML]="getTxIcon(tx.type) | safeHtml"></span>
                </div>
                <div class="tx-info">
                  <span class="tx-desc">
                    @if (tx.type === 'Deposit') {
                      From: {{ tx.senderName ?? 'System' }}
                    } @else if (tx.type === 'Transfer') {
                      To: {{ tx.receiverName ?? 'User' }}
                    } @else {
                      {{ tx.description || tx.type }}
                    }
                  </span>
                  <span class="tx-date">{{ tx.createdAt | date: 'MMM d, h:mm a' }}</span>
                </div>
                <div class="tx-amount-col">
                  <span class="tx-amount" [ngClass]="tx.type === 'Deposit' ? 'tx-amount--credit' : 'tx-amount--debit'">
                    {{ tx.type === 'Deposit' ? '+' : '-' }}{{ tx.amount | currency: tx.currency }}
                  </span>
                  <span class="badge" [ngClass]="getStatusClass(tx.status)">{{ tx.status }}</span>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; }

    /* Balance Hero */
    .balance-hero {
      position: relative;
      background: linear-gradient(135deg, #1a1060 0%, #0f1f3d 100%);
      border: 1px solid rgba(108,99,255,0.25);
      border-radius: var(--radius-2xl);
      padding: 2rem;
      margin-bottom: 1.5rem;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      box-shadow: var(--shadow-glow);
    }
    .balance-hero__bg {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at top left, rgba(108,99,255,0.2) 0%, transparent 60%),
                  radial-gradient(ellipse at bottom right, rgba(0,212,170,0.1) 0%, transparent 60%);
      pointer-events: none;
    }
    .balance-hero__content { z-index: 1; }
    .balance-hero__label {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: var(--font-size-sm); color: rgba(255,255,255,0.6);
      margin-bottom: 0.5rem;
    }
    .balance-hero__amount {
      font-size: 2.75rem; font-weight: 800;
      letter-spacing: -0.04em;
      background: linear-gradient(135deg, #fff, rgba(255,255,255,0.85));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      margin-bottom: 0.75rem;
    }
    .balance-hero__meta { display: flex; align-items: center; gap: 1rem; }
    .balance-hero__updated { font-size: var(--font-size-xs); color: rgba(255,255,255,0.4); }
    .balance-hero__actions { display: flex; gap: 0.75rem; z-index: 1; flex-shrink: 0; }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; }
    .stat-icon {
      width: 44px; height: 44px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      color: #fff;
    }
    .stat-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .stat-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 500; }
    .stat-value { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-text); }

    /* Quick actions */
    .section { margin-bottom: 2rem; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .section-title { font-size: var(--font-size-lg); font-weight: 700; margin-bottom: 0; }
    .quick-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
    .quick-action-card {
      display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-xl);
      color: var(--color-text-muted);
      font-size: var(--font-size-sm); font-weight: 500;
      text-decoration: none;
      transition: all var(--transition-fast);
      min-width: 100px; text-align: center;
      &:hover {
        border-color: var(--color-primary);
        background: var(--color-primary-light);
        color: var(--color-primary);
        transform: translateY(-2px);
      }
    }
    .quick-action-icon {
      width: 48px; height: 48px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      color: #fff;
    }
    .quick-action-label { white-space: nowrap; }

    /* Transactions */
    .tx-list { overflow: hidden; }
    .tx-row {
      display: flex; align-items: center; gap: 1rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--color-border-soft);
      text-decoration: none;
      transition: background var(--transition-fast);
      &:last-child { border-bottom: none; }
      &:hover { background: var(--color-surface-2); }
    }
    .tx-icon {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      &--transfer  { background: var(--color-primary-light); color: var(--color-primary); }
      &--deposit   { background: var(--color-success-bg);    color: var(--color-success); }
      &--withdrawal{ background: var(--color-warning-bg);    color: var(--color-warning); }
    }
    .tx-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; min-width: 0;
      .tx-desc { font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tx-date { font-size: var(--font-size-xs); color: var(--color-text-muted); }
    }
    .tx-amount-col { display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; }
    .tx-amount { font-size: var(--font-size-sm); font-weight: 700;
      &--credit { color: var(--color-success); }
      &--debit  { color: var(--color-text); }
    }

    /* Skeleton rows */
    .tx-skeleton { display: flex; flex-direction: column; gap: 0; border-radius: var(--radius-xl); overflow: hidden; border: 1px solid var(--color-border-soft); }
    .tx-skeleton-row { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: var(--color-surface); border-bottom: 1px solid var(--color-border-soft); &:last-child { border-bottom: none; } }

    /* Empty state */
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; text-align: center;
      p { color: var(--color-text-muted); }
    }

    @media (max-width: 640px) {
      .balance-hero { flex-direction: column; align-items: flex-start; }
      .balance-hero__amount { font-size: 2rem; }
      .balance-hero__actions { width: 100%; }
      .balance-hero__actions .btn { flex: 1; justify-content: center; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private walletSvc = inject(WalletService);
  private auth      = inject(AuthService);

  balance       = signal<WalletBalance | null>(null);
  recentTx      = signal<Transaction[]>([]);
  loadingBalance = signal(true);
  loadingTx      = signal(true);
  refreshing     = signal(false);

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  }

  firstName(): string {
    return this.auth.currentUser()?.fullName.split(' ')[0] ?? 'there';
  }

  stats() {
    return [
      {
        label: 'Available Balance',
        value: new Intl.NumberFormat('en-US', { style: 'currency', currency: this.balance()?.currency ?? 'USD' }).format(this.balance()?.balance ?? 0),
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="17" cy="14" r="1" fill="currentColor"/></svg>',
        bg: 'linear-gradient(135deg,#6C63FF,#8B85FF)',
      },
      {
        label: 'Total Transactions',
        value: (this.recentTx()?.length ?? 0).toString(),
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
        bg: 'linear-gradient(135deg,#00D4AA,#00B894)',
      },
      {
        label: 'Wallet Status',
        value: this.balance()?.isLocked ? 'Locked' : 'Active',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
        bg: 'linear-gradient(135deg,#FFB547,#FF8C00)',
      },
    ];
  };

  quickActions = [
    { label: 'Deposit',      route: '/wallet/deposit', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>', bg: 'linear-gradient(135deg,#6C63FF,#8B85FF)' },
    { label: 'Send Money',   route: '/transfer',       icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>', bg: 'linear-gradient(135deg,#00D4AA,#00B894)' },
    { label: 'History',      route: '/transactions',   icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', bg: 'linear-gradient(135deg,#60A5FA,#3B82F6)' },
    { label: 'My Wallet',    route: '/wallet',         icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="17" cy="14" r="1" fill="currentColor"/></svg>', bg: 'linear-gradient(135deg,#FF5A7E,#FF3860)' },
  ];

  getTxIcon(type: string): string {
    const icons: Record<string, string> = {
      Transfer:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
      Deposit:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
      Withdrawal: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    };
    return icons[type] ?? icons['Transfer'];
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { Success: 'badge--success', Failed: 'badge--danger', Pending: 'badge--warning' };
    return map[status] ?? 'badge--neutral';
  }

  ngOnInit(): void {
    this.refresh();
    // Auto-refresh when signal is triggered
    this.walletSvc.refresh$.subscribe(() => this.refresh());
  }

  refresh(): void {
    this.refreshing.set(true);
    this.loadingBalance.set(true);
    this.loadingTx.set(true);

    this.walletSvc.getBalance().subscribe({
      next: b => { 
        this.balance.set(b); 
        this.loadingBalance.set(false);
        this.checkRefreshDone();
      },
      error: () => { this.loadingBalance.set(false); this.checkRefreshDone(); }
    });

    this.walletSvc.getTransactions(1, 5).subscribe({
      next: r => { 
        this.recentTx.set(r.items); 
        this.loadingTx.set(false); 
        this.checkRefreshDone();
      },
      error: () => { this.loadingTx.set(false); this.checkRefreshDone(); }
    });
  }

  private checkRefreshDone(): void {
    if (!this.loadingBalance() && !this.loadingTx()) {
      this.refreshing.set(false);
    }
  }
}

