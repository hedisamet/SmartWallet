import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

function passwordStrength(ctrl: AbstractControl): ValidationErrors | null {
  const v = ctrl.value as string;
  if (!v) return null;
  if (v.length < 8) return { tooShort: true };
  if (!/[A-Z]/.test(v)) return { noUppercase: true };
  if (!/[0-9]/.test(v)) return { noNumber: true };
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TitleCasePipe],
  template: `
    <div class="auth-page">
      <div class="auth-header">
        <h1>Create account</h1>
        <p>Start managing your finances with VaultFlow</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form" novalidate id="register-form">

        <div class="form-group">
          <label for="fullName">Full Name</label>
          <input id="fullName" type="text" formControlName="fullName"
            class="form-control" [class.is-error]="isInvalid('fullName')"
            placeholder="John Doe" autocomplete="name"/>
          @if (isInvalid('fullName')) {
            <span class="form-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Full name is required
            </span>
          }
        </div>

        <div class="form-group">
          <label for="reg-email">Email address</label>
          <input id="reg-email" type="email" formControlName="email"
            class="form-control" [class.is-error]="isInvalid('email')"
            placeholder="you@example.com" autocomplete="email"/>
          @if (isInvalid('email')) {
            <span class="form-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Please enter a valid email
            </span>
          }
        </div>

        <div class="form-group">
          <label for="reg-password">Password</label>
          <div class="input-wrapper">
            <input [type]="showPwd() ? 'text' : 'password'"
              id="reg-password" formControlName="password"
              class="form-control" [class.is-error]="isInvalid('password')"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              autocomplete="new-password"/>
            <button type="button" class="eye-btn" (click)="showPwd.update(v=>!v)" aria-label="Toggle password">
              @if (showPwd()) {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
          <!-- Strength meter -->
          <div class="strength-meter">
            <div class="strength-bars">
              @for (i of [1,2,3,4]; track i) {
                <div class="strength-bar" [class.filled]="strength() >= i" [class]="'strength-bar strength-bar--' + strengthLabel()"></div>
              }
            </div>
            @if (form.get('password')?.value) {
              <span class="strength-text" [class]="'strength-text--' + strengthLabel()">{{ strengthLabel() | titlecase }}</span>
            }
          </div>
          @if (isInvalid('password')) {
            <span class="form-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ passwordError() }}
            </span>
          }
        </div>

        <button type="submit" class="btn btn--primary btn--full btn--lg" id="register-submit"
          [disabled]="loading()">
          @if (loading()) {
            <span class="spinner"></span> Creating account…
          } @else {
            Create Account
          }
        </button>
      </form>

      <div class="divider"></div>
      <p class="auth-switch">
        Already have an account? <a routerLink="/auth/login" id="go-login">Sign in</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-header { margin-bottom: 2rem;
      h1 { font-size: var(--font-size-xl); margin-bottom: 0.5rem; }
      p  { color: var(--color-text-muted); font-size: var(--font-size-sm); }
    }
    .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .input-wrapper { position: relative; }
    .input-wrapper .form-control { padding-right: 2.75rem; }
    .eye-btn {
      position: absolute; top: 50%; right: 0.75rem;
      transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: var(--color-text-muted); display: flex;
      &:hover { color: var(--color-text); }
    }
    .strength-meter {
      display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem;
    }
    .strength-bars { display: flex; gap: 4px; flex: 1; }
    .strength-bar {
      height: 4px; flex: 1; border-radius: 2px;
      background: var(--color-surface-3);
      transition: background var(--transition-fast);
      &.filled {
        &.strength-bar--weak   { background: var(--color-danger); }
        &.strength-bar--fair   { background: var(--color-warning); }
        &.strength-bar--good   { background: var(--color-info); }
        &.strength-bar--strong { background: var(--color-success); }
      }
    }
    .strength-text { font-size: var(--font-size-xs); font-weight: 600; white-space: nowrap;
      &--weak   { color: var(--color-danger);  }
      &--fair   { color: var(--color-warning); }
      &--good   { color: var(--color-info);    }
      &--strong { color: var(--color-success); }
    }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    .auth-switch { text-align: center; font-size: var(--font-size-sm); color: var(--color-text-muted);
      a { font-weight: 600; color: var(--color-primary); }
    }
  `]
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  loading  = signal(false);
  showPwd  = signal(false);

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, passwordStrength]],
  });

  isInvalid(f: string): boolean {
    const c = this.form.get(f)!;
    return c.invalid && (c.dirty || c.touched);
  }

  strength(): number {
    const v = this.form.get('password')?.value ?? '';
    if (!v) return 0;
    let s = 0;
    if (v.length >= 8)          s++;
    if (/[A-Z]/.test(v))        s++;
    if (/[0-9]/.test(v))        s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  }

  strengthLabel(): string {
    const s = this.strength();
    if (s <= 1) return 'weak';
    if (s === 2) return 'fair';
    if (s === 3) return 'good';
    return 'strong';
  }

  passwordError(): string {
    const errs = this.form.get('password')?.errors;
    if (errs?.['tooShort'])    return 'Password must be at least 8 characters';
    if (errs?.['noUppercase']) return 'Add at least one uppercase letter';
    if (errs?.['noNumber'])    return 'Add at least one number';
    return 'Password is required';
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Account created!', 'Welcome to VaultFlow.');
        this.router.navigate(['/dashboard']);
      },
      error: () => this.loading.set(false),
    });
  }
}
