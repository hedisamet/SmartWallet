import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header animate-fade-in-up stagger-1">
        <h1>Profile & Settings</h1>
        <p>Manage your account information</p>
      </div>

      <div class="profile-layout">
        <!-- Avatar Card -->
        <div class="profile-sidebar animate-fade-in-up stagger-2">
          <div class="card avatar-card">
            <div class="avatar-large">{{ initials() }}</div>
            <h3>{{ user()?.fullName }}</h3>
            <p>{{ user()?.email }}</p>
            <span class="badge" [class]="user()?.role === 'Admin' ? 'badge--info' : 'badge--success'">
              {{ user()?.role }}
            </span>
          </div>

          <div class="card security-info">
            <h4>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Security
            </h4>
            <ul class="security-list">
              <li class="security-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                JWT authentication active
              </li>
              <li class="security-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                256-bit encrypted sessions
              </li>
              <li class="security-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Idempotency-protected transactions
              </li>
            </ul>
          </div>
        </div>

        <!-- Profile Form -->
        <div class="profile-main animate-fade-in-up stagger-3">
          <div class="card">
            <h3 style="margin-bottom:1.5rem">Account Information</h3>
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" novalidate id="profile-form">
              <div class="form-grid">
                <div class="form-group">
                  <label for="fullName-profile">Full Name</label>
                  <input id="fullName-profile" type="text" formControlName="fullName"
                    class="form-control" [class.is-error]="isInvalid(profileForm, 'fullName')" />
                  @if (isInvalid(profileForm, 'fullName')) {
                    <span class="form-error">Name is required</span>
                  }
                </div>
                <div class="form-group">
                  <label for="email-profile">Email Address</label>
                  <input id="email-profile" type="email" formControlName="email"
                    class="form-control" readonly />
                  <span class="form-hint">Email cannot be changed</span>
                </div>
              </div>
              <button type="submit" class="btn btn--primary" id="save-profile-btn" [disabled]="savingProfile()">
                @if (savingProfile()) { <span class="spinner"></span> Saving… } @else { Save Changes }
              </button>
            </form>
          </div>

          <!-- Change Password -->
          <div class="card" style="margin-top:1.5rem">
            <h3 style="margin-bottom:1.5rem">Change Password</h3>
            <form [formGroup]="pwdForm" (ngSubmit)="changePassword()" novalidate id="change-pwd-form">
              <div class="form-group" style="margin-bottom:1.25rem">
                <label for="current-pwd">Current Password</label>
                <input id="current-pwd" type="password" formControlName="currentPassword"
                  class="form-control" [class.is-error]="isInvalid(pwdForm, 'currentPassword')"
                  autocomplete="current-password" />
              </div>
              <div class="form-group" style="margin-bottom:1.25rem">
                <label for="new-pwd">New Password</label>
                <input id="new-pwd" type="password" formControlName="newPassword"
                  class="form-control" [class.is-error]="isInvalid(pwdForm, 'newPassword')"
                  autocomplete="new-password" />
                @if (isInvalid(pwdForm, 'newPassword')) {
                  <span class="form-error">Min 8 chars, 1 uppercase, 1 number</span>
                }
              </div>
              <div class="form-group" style="margin-bottom:2rem">
                <label for="confirm-pwd">Confirm New Password</label>
                <input id="confirm-pwd" type="password" formControlName="confirmPassword"
                  class="form-control" [class.is-error]="pwdForm.errors?.['mismatch'] && pwdForm.touched" />
                @if (pwdForm.errors?.['mismatch'] && pwdForm.touched) {
                  <span class="form-error">Passwords do not match</span>
                }
              </div>
              <button type="submit" class="btn btn--outline" id="change-pwd-btn" [disabled]="savingPwd()">
                @if (savingPwd()) { <span class="spinner"></span> Updating… } @else { Update Password }
              </button>
            </form>
          </div>

          <!-- Danger Zone -->
          <div class="card danger-zone" style="margin-top:1.5rem">
            <h3>Danger Zone</h3>
            <p>These actions are irreversible. Please be certain.</p>
            <div class="divider"></div>
            <div class="danger-actions">
              <div>
                <strong>Sign out everywhere</strong>
                <p>Remove all active sessions across devices</p>
              </div>
              <button class="btn btn--danger" id="logout-all-btn" (click)="auth.logout()">Sign Out</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 960px; }
    .profile-layout { display: flex; gap: 1.5rem; align-items: flex-start; }
    .profile-sidebar { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 1rem; }

    .avatar-card { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; text-align: center; padding: 2rem;
      h3 { font-size: var(--font-size-md); margin: 0; }
      p  { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }
    }
    .avatar-large {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; font-weight: 800; color: #fff;
    }
    .security-info h4 { display: flex; align-items: center; gap: 0.5rem; font-size: var(--font-size-sm); margin-bottom: 1rem; }
    .security-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .security-item { display: flex; align-items: center; gap: 0.5rem; font-size: var(--font-size-xs); color: var(--color-text-muted); }

    .profile-main { flex: 1; min-width: 0; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }
    .form-hint { font-size: var(--font-size-xs); color: var(--color-text-faint); margin-top: 0.25rem; display: block; }

    .danger-zone { border-color: rgba(255,90,126,0.2); }
    .danger-zone h3 { color: var(--color-danger); }
    .danger-zone p { font-size: var(--font-size-sm); }
    .danger-actions { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .danger-actions strong { font-size: var(--font-size-sm); color: var(--color-text); display: block; margin-bottom: 0.25rem; }
    .danger-actions p { font-size: var(--font-size-xs); margin: 0; }

    .spinner { width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block; }

    @media (max-width: 768px) {
      .profile-layout { flex-direction: column; }
      .profile-sidebar { width: 100%; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ProfileComponent {
  auth   = inject(AuthService);
  private fb     = inject(FormBuilder);
  private notify = inject(NotificationService);

  user         = this.auth.currentUser;
  savingProfile = signal(false);
  savingPwd     = signal(false);

  initials(): string {
    return (this.user()?.fullName ?? '').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
  }

  profileForm = this.fb.nonNullable.group({
    fullName: [this.auth.currentUser()?.fullName ?? '', Validators.required],
    email:    [{ value: this.auth.currentUser()?.email ?? '', disabled: true }],
  });

  pwdForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: (g) => {
        const n = g.get('newPassword')?.value;
        const c = g.get('confirmPassword')?.value;
        return n === c ? null : { mismatch: true };
      }
    }
  );

  isInvalid(form: any, f: string): boolean {
    const c = form.get(f)!;
    return c.invalid && (c.dirty || c.touched);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.savingProfile.set(true);
    // Simulate save — wire to real API endpoint when available
    setTimeout(() => {
      this.savingProfile.set(false);
      this.notify.success('Profile updated!', 'Your changes have been saved.');
    }, 800);
  }

  changePassword(): void {
    if (this.pwdForm.invalid) { this.pwdForm.markAllAsTouched(); return; }
    this.savingPwd.set(true);
    setTimeout(() => {
      this.savingPwd.set(false);
      this.pwdForm.reset();
      this.notify.success('Password updated!', 'Please use your new password next time.');
    }, 800);
  }
}
