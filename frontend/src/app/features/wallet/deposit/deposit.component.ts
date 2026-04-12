import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { WalletService }      from '../../../core/services/wallet.service';
import { NotificationService } from '../../../core/services/notification.service';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'MAD', 'TND'];

@Component({
  selector: 'app-deposit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <div class="page-nav animate-fade-in-up stagger-1">
        <a routerLink="/wallet" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Wallet
        </a>
      </div>

      <div class="page-header animate-fade-in-up stagger-2">
        <h1>Deposit Funds</h1>
        <p>Add money to your VaultFlow wallet</p>
      </div>

      <div class="deposit-layout">
        <!-- Form -->
        <div class="card animate-fade-in-up stagger-3" style="flex:1">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate id="deposit-form">

            <!-- Amount -->
            <div class="form-group" style="margin-bottom:1.5rem">
              <label for="amount">Amount</label>
              <div class="amount-input-wrapper">
                <span class="currency-symbol">{{ selectedCurrency() }}</span>
                <input id="amount" type="number" formControlName="amount"
                  class="form-control amount-input"
                  [class.is-error]="isInvalid('amount')"
                  placeholder="0.00" min="1" step="0.01"/>
              </div>
              @if (isInvalid('amount')) {
                <span class="form-error">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Please enter a valid amount (min 1)
                </span>
              }
            </div>

            <!-- Quick amounts -->
            <div class="quick-amounts" style="margin-bottom:1.5rem">
              <span class="quick-amounts__label">Quick select</span>
              <div class="quick-amounts__grid">
                @for (amt of quickAmounts; track amt) {
                  <button type="button" class="quick-amount-btn"
                    [class.selected]="form.get('amount')?.value === amt"
                    (click)="setAmount(amt)">
                    {{ amt | number }}
                  </button>
                }
              </div>
            </div>

            <!-- Currency -->
            <div class="form-group" style="margin-bottom:2rem">
              <label>Currency</label>
              <div class="currency-grid">
                @for (cur of currencies; track cur) {
                  <button type="button" class="currency-btn"
                    [class.selected]="form.get('currency')?.value === cur"
                    (click)="form.get('currency')?.setValue(cur)">
                    {{ cur }}
                  </button>
                }
              </div>
            </div>

            <button type="submit" class="btn btn--accent btn--full btn--lg" id="deposit-submit" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner"></span> Processing…
              } @else {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Deposit {{ form.get('currency')?.value }} {{ form.get('amount')?.value || '0.00' }}
              }
            </button>
          </form>
        </div>

        <!-- Info sidebar -->
        <div class="deposit-info animate-fade-in-up stagger-4">
          <div class="card info-card">
            <div class="info-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
            </div>
            <h4>How deposits work</h4>
            <ul class="info-list">
              <li>Funds are credited instantly to your wallet</li>
              <li>Each deposit uses a unique idempotency key for safety</li>
              <li>Deposits are protected by 256-bit encryption</li>
              <li>Minimum deposit: 1 unit of currency</li>
            </ul>
          </div>

          <div class="card security-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div>
              <strong>256-bit encrypted</strong>
              <p>Your transaction is fully secured</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; }
    .page-nav { margin-bottom: 1.5rem; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--color-text-muted); font-size: var(--font-size-sm); font-weight: 500; text-decoration: none; transition: color var(--transition-fast);
      &:hover { color: var(--color-primary); }
    }
    .deposit-layout { display: flex; gap: 1.5rem; align-items: flex-start; }
    .deposit-info { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 1rem; }

    /* Amount input */
    .amount-input-wrapper { position: relative; }
    .currency-symbol {
      position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
      font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text-muted); pointer-events: none;
    }
    .amount-input { padding-left: 3.25rem; font-size: var(--font-size-xl); font-weight: 700; height: 60px; }

    /* Quick amounts */
    .quick-amounts__label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 0.5rem; }
    .quick-amounts__grid { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .quick-amount-btn {
      padding: 0.4rem 1rem; border-radius: var(--radius-md);
      border: 1px solid var(--color-border-soft);
      background: var(--color-surface-2); color: var(--color-text-muted);
      font-size: var(--font-size-sm); font-weight: 500; cursor: pointer;
      transition: all var(--transition-fast);
      &:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-light); }
      &.selected { border-color: var(--color-primary); background: var(--color-primary-light); color: var(--color-primary); font-weight: 600; }
    }

    /* Currency grid */
    .currency-grid { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .currency-btn {
      padding: 0.4rem 1rem; border-radius: var(--radius-md);
      border: 1px solid var(--color-border-soft);
      background: var(--color-surface-2); color: var(--color-text-muted);
      font-size: var(--font-size-sm); font-weight: 600; cursor: pointer;
      transition: all var(--transition-fast);
      &:hover { border-color: var(--color-accent); color: var(--color-accent); }
      &.selected { border-color: var(--color-accent); background: var(--color-accent-light); color: var(--color-accent); }
    }

    /* Info */
    .info-card { display: flex; flex-direction: column; gap: 0.75rem; }
    .info-icon { color: var(--color-primary); }
    .info-card h4 { font-size: var(--font-size-sm); font-weight: 700; }
    .info-list { display: flex; flex-direction: column; gap: 0.5rem;
      li { font-size: var(--font-size-xs); color: var(--color-text-muted); padding-left: 0.75rem; position: relative;
        &::before { content:'•'; position: absolute; left:0; color: var(--color-accent); }
      }
    }
    .security-badge { display: flex; align-items: center; gap: 0.75rem; padding: 1rem;
      strong { font-size: var(--font-size-sm); color: var(--color-text); display: block; }
      p { font-size: var(--font-size-xs); margin: 0; }
    }
    .spinner { width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block; }

    @media (max-width: 768px) {
      .deposit-layout { flex-direction: column; }
      .deposit-info { width: 100%; }
    }
  `]
})
export class DepositComponent {
  private fb        = inject(FormBuilder);
  private walletSvc = inject(WalletService);
  private notify    = inject(NotificationService);
  private router    = inject(Router);

  loading         = signal(false);
  selectedCurrency = signal('USD');
  currencies       = CURRENCIES;
  quickAmounts     = [50, 100, 250, 500, 1000];

  form = this.fb.nonNullable.group({
    amount:   [null as unknown as number, [Validators.required, Validators.min(1)]],
    currency: ['USD', Validators.required],
  });

  constructor() {
    this.form.get('currency')!.valueChanges.subscribe(v => this.selectedCurrency.set(v));
  }

  isInvalid(f: string): boolean {
    const c = this.form.get(f)!;
    return c.invalid && (c.dirty || c.touched);
  }

  setAmount(amt: number): void {
    this.form.get('amount')?.setValue(amt);
    this.form.get('amount')?.markAsDirty();
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const idempotencyKey = crypto.randomUUID();
    this.walletSvc.deposit(this.form.getRawValue() as any, idempotencyKey).subscribe({
      next: () => {
        this.walletSvc.triggerRefresh();
        this.notify.success('Deposit successful! 🎉', `Funds added to your wallet.`);
        this.router.navigate(['/wallet']);
      },
      error: () => this.loading.set(false),
    });
  }
}
