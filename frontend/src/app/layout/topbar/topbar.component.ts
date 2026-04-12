import { Component, Output, EventEmitter, inject, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SignalrService } from '../../core/services/signalr.service';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { NotificationDrawerComponent } from '../../shared/components/notification-drawer/notification-drawer.component';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, ConfirmModalComponent, NotificationDrawerComponent, NgIf],
  template: `
    <header class="topbar">
      <button class="menu-btn btn btn--ghost btn--icon" (click)="menuToggle.emit()" aria-label="Toggle menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div class="topbar-center">
        <div class="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" placeholder="Search transactions..." aria-label="Search transactions" id="topbar-search" />
        </div>
      </div>

      <div class="topbar-actions">
        <!-- Notification bell -->
        <button class="btn btn--ghost btn--icon notif-btn" 
          (click)="toggleNotifs($event)" 
          aria-label="Notifications" id="notifications-btn"
          [class.pulse-animation]="hasUnread()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span class="notif-dot" *ngIf="hasUnread()"></span>
        </button>

        <!-- Quick deposit -->
        <a routerLink="/wallet/deposit" class="btn btn--primary btn--sm hide-mobile" id="topbar-deposit-btn">
          + Deposit
        </a>

        <!-- User avatar dropdown -->
        <div class="dropdown-wrapper">
          <div class="topbar-avatar" (click)="toggleProfile($event)" [title]="user()?.fullName ?? ''" id="topbar-avatar-btn">
            {{ userInitials() }}
          </div>

          @if (showProfileMenu()) {
            <div class="dropdown-menu dropdown-menu--right animate-fade-in-up">
              <div class="dropdown-user-info">
                <strong>{{ user()?.fullName }}</strong>
                <span>{{ user()?.email }}</span>
              </div>
              <div class="divider"></div>
              <a routerLink="/profile" class="dropdown-item" (click)="showProfileMenu.set(false)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                My Profile
              </a>
              <a routerLink="/wallet" class="dropdown-item" (click)="showProfileMenu.set(false)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/></svg>
                My Wallet
              </a>
              <div class="divider"></div>
              <button class="dropdown-item text-danger" (click)="logout()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Sign Out
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Overlays -->
      <app-notification-drawer 
        [show]="showNotifDrawer()" 
        (close)="showNotifDrawer.set(false)">
      </app-notification-drawer>

      <app-confirm-modal
        [show]="showLogoutModal()"
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        confirmClass="btn--danger"
        iconType="danger"
        (confirm)="onLogoutConfirm()"
        (cancel)="showLogoutModal.set(false)">
      </app-confirm-modal>
    </header>
  `,
  styles: [`
    .topbar {
      height: 64px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border-soft);
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
      backdrop-filter: blur(12px);
    }
    .menu-btn { color: var(--color-text-muted); }
    .topbar-center { flex: 1; max-width: 480px; }
    .search-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-md);
      padding: 0.5rem 1rem;
      color: var(--color-text-muted);
      transition: border-color var(--transition-fast);
      &:focus-within {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px var(--color-primary-light);
      }
      input {
        background: none;
        border: none;
        outline: none;
        color: var(--color-text);
        font-size: var(--font-size-sm);
        width: 100%;
        &::placeholder { color: var(--color-text-faint); }
      }
    }
    .topbar-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .notif-btn { position: relative; color: var(--color-text-muted); }
    .notif-dot {
      position: absolute;
      top: 4px; right: 4px;
      width: 10px; height: 10px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF5A7E, #F93131);
      border: 2px solid var(--color-surface);
      box-shadow: 0 0 10px rgba(255, 90, 126, 0.6);
      z-index: 2;
    }
    .pulse-animation {
      animation: jewel-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes jewel-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; box-shadow: 0 0 15px rgba(255, 90, 126, 0.8); }
    }

    /* Dropdowns */
    .dropdown-wrapper { position: relative; }
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 12px);
      width: 240px;
      background: var(--color-surface);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      padding: 0.5rem;
      z-index: var(--z-dropdown);
      &--right { right: 0; }
    }
    .dropdown-header { font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted); padding: 0.5rem 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .dropdown-content--empty { display:flex; flex-direction:column; align-items:center; padding: 2rem 1rem; color: var(--color-text-faint); font-size: var(--font-size-sm); }
    .dropdown-footer { border-top: 1px solid var(--color-border-soft); padding: 0.75rem; text-align: center; font-size: var(--font-size-xs); color: var(--color-primary); font-weight: 600; cursor: pointer; }
    
    .dropdown-user-info { padding: 0.75rem; display: flex; flex-direction: column; 
      strong { font-size: var(--font-size-sm); color: var(--color-text); }
      span { font-size: var(--font-size-xs); color: var(--color-text-muted); }
    }
    .dropdown-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.625rem 0.75rem; border-radius: var(--radius-md);
      color: var(--color-text-muted); font-size: var(--font-size-sm); font-weight: 500;
      text-decoration: none; cursor: pointer; transition: all var(--transition-fast);
      border: none; background: none; width: 100%; text-align: left;
      &:hover { background: var(--color-surface-2); color: var(--color-primary); }
      &.text-danger:hover { background: var(--color-danger-light); color: var(--color-danger); }
    }

    .topbar-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-xs);
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      user-select: none;
      transition: transform var(--transition-fast);
      &:hover { transform: scale(1.05); }
    }
    @media (max-width: 640px) {
      .search-bar { display: none; }
    }
  `]
})
export class TopbarComponent {
  @Output() menuToggle = new EventEmitter<void>();
  private auth = inject(AuthService);
  private signalr = inject(SignalrService);
  
  user = this.auth.currentUser;

  showProfileMenu = signal(false);
  showNotifDrawer = signal(false);
  showLogoutModal = signal(false);
  hasUnread       = signal(false);

  constructor() {
    // Close menus on outside click
    window.addEventListener('click', () => {
      this.showProfileMenu.set(false);
    });

    // Handle incoming real-time notifications
    effect(() => {
      const n = this.signalr.newNotification();
      if (n) {
        this.hasUnread.set(true);
      }
    });
  }

  userInitials(): string {
    return (this.auth.currentUser()?.fullName ?? '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  toggleProfile(e: Event) {
    e.stopPropagation();
    this.showProfileMenu.update((v: boolean) => !v);
  }

  toggleNotifs(e: Event) {
    e.stopPropagation();
    this.showNotifDrawer.set(true);
    this.hasUnread.set(false);
    this.showProfileMenu.set(false);
  }

  logout() {
    this.showLogoutModal.set(true);
    this.showProfileMenu.set(false);
  }

  onLogoutConfirm() {
    this.auth.logout();
    this.showLogoutModal.set(false);
  }
}
