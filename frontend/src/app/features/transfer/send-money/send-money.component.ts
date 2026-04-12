import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { WalletService } from '../../../core/services/wallet.service';
import { TransferRequest } from '../../../core/models/models';

@Component({
  selector: 'app-send-money',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-nav animate-fade-in-up stagger-1">
        <a routerLink="/dashboard" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Dashboard
        </a>
      </div>

      <div class="page-header animate-fade-in-up stagger-2">
        <h1>Send Money</h1>
        <p>Transfer funds to any VaultFlow wallet instantly</p>
      </div>

      <div class="send-layout">
        <div class="card animate-fade-in-up stagger-3" style="flex:1">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate id="send-money-form">

            <div class="form-group" style="margin-bottom:1.5rem">
              <label for="receiverWalletId">Recipient Wallet ID</label>
              <div class="input-with-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input id="receiverWalletId" type="text" formControlName="receiverWalletId"
                  class="form-control"
                  [class.is-error]="isInvalid('receiverWalletId')"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              </div>
              @if (isInvalid('receiverWalletId')) {
                <span class="form-error">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                  Please enter a valid wallet ID
                </span>
              }
            </div>

            <div class="amount-currency-row" style="margin-bottom:1.5rem">
              <div class="form-group" style="flex:1">
                <label for="send-amount">Amount</label>
                <input id="send-amount" type="number" formControlName="amount"
                  class="form-control amount-input"
                  [class.is-error]="isInvalid('amount')"
                  placeholder="0.00" min="0.01" step="0.01"/>
                @if (isInvalid('amount')) {
                  <span class="form-error">Enter a valid amount</span>
                }
              </div>
              <div class="form-group currency-select-group">
                <label for="send-currency">Currency</label>
                <select id="send-currency" formControlName="currency" class="form-control">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="MAD">MAD</option>
                  <option value="TND">TND</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:2rem">
              <label for="description">Note <span class="optional">(optional)</span></label>
              <input id="description" type="text" formControlName="description"
                class="form-control"
                placeholder="e.g. Rent payment, Split dinner…"
                maxlength="100"/>
            </div>

            <!-- Preview pill -->
            @if (form.get('amount')?.value && form.get('receiverWalletId')?.valid) {
              <div class="transfer-preview">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Sending
                <strong>{{ form.get('currency')?.value }} {{ form.get('amount')?.value }}</strong>
                to wallet ending in
                <strong>…{{ form.get('receiverWalletId')?.value?.slice(-6) }}</strong>
              </div>
            }

            <button type="submit" class="btn btn--primary btn--full btn--lg" id="send-submit" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner"></span> Preparing…
              } @else {
                Review Transfer
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              }
            </button>
          </form>
        </div>

        <!-- Tips card -->
        <div class="send-tips animate-fade-in-up stagger-4">
          <div class="card tips-card">
            <h4>💡 Transfer Tips</h4>
            <ul class="tips-list">
              <li>Double-check the wallet ID before sending</li>
              <li>Transfers are instant and irreversible</li>
              <li>Each transfer is idempotency-protected</li>
              <li>Add a note for better tracking</li>
            </ul>
          </div>
          <div class="card security-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div>
              <strong>Bank-level security</strong>
              <p>End-to-end encrypted transfers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; }
    .page-nav { margin-bottom: 1.5rem; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--color-text-muted); font-size: var(--font-size-sm); font-weight: 500; text-decoration: none; transition: color var(--transition-fast); &:hover { color: var(--color-primary); } }
    .send-layout { display: flex; gap: 1.5rem; align-items: flex-start; }
    .send-tips { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 1rem; }

    .input-with-icon { position: relative;
      svg { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); pointer-events: none; }
      .form-control { padding-left: 2.75rem; }
    }
    .amount-currency-row { display: flex; gap: 1rem; align-items: flex-start; }
    .currency-select-group { width: 120px; flex-shrink: 0; }
    .amount-input { font-size: var(--font-size-lg); font-weight: 700; height: 52px; }
    .optional { font-weight: 400; color: var(--color-text-faint); font-size: var(--font-size-xs); }

    .transfer-preview {
      display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
      background: var(--color-accent-light); border: 1px solid rgba(0,212,170,0.2);
      border-radius: var(--radius-md); padding: 0.75rem 1rem;
      font-size: var(--font-size-sm); color: var(--color-text-muted);
      margin-bottom: 1.5rem;
      strong { color: var(--color-accent); }
    }

    .tips-card h4 { font-size: var(--font-size-sm); font-weight: 700; margin-bottom: 0.75rem; }
    .tips-list { display: flex; flex-direction: column; gap: 0.5rem;
      li { font-size: var(--font-size-xs); color: var(--color-text-muted); padding-left: 0.75rem; position: relative;
        &::before { content: '→'; position: absolute; left: 0; color: var(--color-primary); font-size: 0.6rem; top: 1px; }
      }
    }
    .security-badge { display: flex; align-items: center; gap: 0.75rem; padding: 1rem;
      strong { font-size: var(--font-size-sm); color: var(--color-text); display: block; }
      p { font-size: var(--font-size-xs); margin: 0; }
    }
    .spinner { width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block; }

    @media (max-width: 768px) {
      .send-layout { flex-direction: column; }
      .send-tips { width: 100%; }
    }
  `]
})
export class SendMoneyComponent {
  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private walletSvc = inject(WalletService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    receiverWalletId: ['', [Validators.required, Validators.pattern(/^[0-9a-f-]{36}$/i)]],
    amount:   [null as unknown as number, [Validators.required, Validators.min(0.01)]],
    currency: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    this.walletSvc.getBalance().subscribe(b => {
      if (b && b.currency) this.form.patchValue({ currency: b.currency });
    });
  }

  isInvalid(f: string): boolean {
    const c = this.form.get(f)!;
    return c.invalid && (c.dirty || c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    // Pass data to confirmation page via state
    const data: TransferRequest = this.form.getRawValue() as any;
    this.router.navigate(['/transfer/confirm'], { state: { transfer: data } });
  }
}
