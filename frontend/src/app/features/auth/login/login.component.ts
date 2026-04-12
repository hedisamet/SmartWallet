import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-header">
        <h1>Welcome back</h1>
        <p>Sign in to your VaultFlow account</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form" novalidate id="login-form">

        <div class="form-group">
          <label for="email">Email address</label>
          <input id="email" type="email" formControlName="email"
            class="form-control"
            [class.is-error]="isInvalid('email')"
            placeholder="you@example.com"
            autocomplete="email" />
          @if (isInvalid('email')) {
            <span class="form-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Please enter a valid email address
            </span>
          }
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <input [type]="showPassword() ? 'text' : 'password'"
              id="password" formControlName="password"
              class="form-control"
              [class.is-error]="isInvalid('password')"
              placeholder="Enter your password"
              autocomplete="current-password" />
            <button type="button" class="eye-btn" (click)="showPassword.update(v => !v)"
              [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
              @if (showPassword()) {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
          @if (isInvalid('password')) {
            <span class="form-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Password is required
            </span>
          }
        </div>

        <button type="submit" class="btn btn--primary btn--full btn--lg" id="login-submit"
          [disabled]="loading()">
          @if (loading()) {
            <span class="spinner"></span> Signing in…
          } @else {
            Sign In
          }
        </button>
      </form>

      <div class="divider"></div>

      <p class="auth-switch">
        Don't have an account?
        <a routerLink="/auth/register" id="go-register">Create one free</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-header {
      margin-bottom: 2rem;
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
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    .auth-switch {
      text-align: center;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      a { font-weight: 600; color: var(--color-primary); }
    }
  `]
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  loading      = signal(false);
  showPassword = signal(false);

  form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Welcome back!', 'You are now signed in.');
        this.router.navigate(['/dashboard']);
      },
      error: () => this.loading.set(false),
    });
  }
}
