import { Component, Input, Output, EventEmitter, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SafeHtmlPipe, ConfirmModalComponent],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-mark">
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="url(#sg1)"/>
            <path d="M8 10l10 16 10-16" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13 18c2 2 8 2 10 0" stroke="#00D4AA" stroke-width="2" stroke-linecap="round"/>
            <defs>
              <linearGradient id="sg1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6C63FF"/><stop offset="1" stop-color="#8B85FF"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        @if (!collapsed) {
          <span class="logo-text">VaultFlow</span>
        }
        <button class="collapse-btn" (click)="toggleCollapse.emit()" [attr.aria-label]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            @if (collapsed) {
              <path d="M9 18l6-6-6-6"/>
            } @else {
              <path d="M15 18l-6-6 6-6"/>
            }
          </svg>
        </button>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav" aria-label="Main navigation">
        @for (item of visibleItems(); track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}"
             class="nav-item"
             [attr.aria-label]="item.label"
             [title]="collapsed ? item.label : ''">
            <span class="nav-icon" [innerHTML]="item.icon | safeHtml"></span>
            @if (!collapsed) {
              <span class="nav-label">{{ item.label }}</span>
            }
            @if (!collapsed) {
              <span class="nav-indicator"></span>
            }
          </a>
        }
      </nav>

      <!-- User footer -->
      <div class="sidebar-footer">
        @if (!collapsed) {
          <div class="user-info">
            <div class="user-avatar">
              {{ userInitials() }}
            </div>
            <div class="user-meta">
              <span class="user-name">{{ user()?.fullName }}</span>
              <span class="user-role">{{ user()?.role }}</span>
            </div>
          </div>
        } @else {
          <div class="user-avatar user-avatar--sm" [title]="user()?.fullName ?? ''">
            {{ userInitials() }}
          </div>
        }
        <button class="logout-btn btn btn--ghost btn--icon" (click)="logout()" title="Sign out" aria-label="Sign out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>
    </aside>

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
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0; left: 0;
      height: 100vh;
      width: 260px;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border-soft);
      display: flex;
      flex-direction: column;
      transition: width var(--transition-base);
      z-index: var(--z-sticky);
      overflow: hidden;
    }
    .sidebar.collapsed { width: 72px; }

    /* Logo */
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid var(--color-border-soft);
      min-height: 68px;
      position: relative;
    }
    .logo-text {
      font-size: 1.25rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      white-space: nowrap;
      letter-spacing: -0.03em;
    }
    .collapse-btn {
      margin-left: auto;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border-soft);
      color: var(--color-text-muted);
      border-radius: var(--radius-sm);
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
      flex-shrink: 0;
      &:hover { background: var(--color-primary-light); color: var(--color-primary); }
    }
    .sidebar.collapsed .collapse-btn { margin-left: 0; }

    /* Nav */
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.875rem;
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: var(--font-size-sm);
      font-weight: 500;
      transition: all var(--transition-fast);
      position: relative;
      white-space: nowrap;

      &:hover {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }
      &.active {
        background: var(--color-primary-light);
        color: var(--color-primary);
        font-weight: 600;
        .nav-indicator {
          opacity: 1;
          transform: scaleY(1);
        }
      }
    }
    .nav-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      width: 20px;
    }
    .nav-label { flex: 1; }
    .nav-indicator {
      width: 3px; height: 16px;
      background: var(--color-primary);
      border-radius: var(--radius-full);
      opacity: 0;
      transform: scaleY(0);
      transition: all var(--transition-fast);
      margin-left: auto;
    }

    /* Footer */
    .sidebar-footer {
      padding: 1rem 0.75rem;
      border-top: 1px solid var(--color-border-soft);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;
    }
    .user-avatar {
      width: 36px; height: 36px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-sm);
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
      cursor: default;
    }
    .user-avatar--sm { margin: 0 auto; }
    .user-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .user-name {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }
    .logout-btn { flex-shrink: 0; color: var(--color-text-muted); }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        &:not(.collapsed) { transform: translateX(0); }
      }
    }
  `]
})
export class SidebarComponent {
  @Input()  collapsed     = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  private auth = inject(AuthService);
  user = this.auth.currentUser;

  private readonly NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard',     route: '/dashboard',         icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' },
    { label: 'My Wallet',     route: '/wallet',            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8L4 7h16l-4-4z"/><circle cx="17" cy="14" r="1" fill="currentColor"/></svg>' },
    { label: 'Send Money',    route: '/transfer',          icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' },
    { label: 'Transactions',  route: '/transactions',      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
    { label: 'Profile',       route: '/profile',           icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { label: 'Admin Panel',   route: '/admin',             icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', adminOnly: true },
  ];

  visibleItems = computed(() =>
    this.NAV_ITEMS.filter(i => !i.adminOnly || this.auth.isAdmin())
  );

  userInitials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  });

  showLogoutModal = signal(false);

  logout(): void { 
    this.showLogoutModal.set(true);
  }

  onLogoutConfirm(): void {
    this.auth.logout();
    this.showLogoutModal.set(false);
  }
}
