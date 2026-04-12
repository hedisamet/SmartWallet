import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AdminUser } from '../../../core/models/models';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, SafeHtmlPipe],
  template: `
    <div class="page">
      <div class="page-header animate-fade-in-up stagger-1">
        <h1>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" style="margin-right:0.5rem;vertical-align:middle"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Admin Dashboard
        </h1>
        <p>Manage the VaultFlow platform</p>
      </div>

      <!-- Stats -->
      <div class="admin-stats animate-fade-in-up stagger-2">
        @for (stat of stats(); track stat.label) {
          <div class="admin-stat-card card">
            <div class="stat-icon-admin" [style.background]="stat.color + '20'" [style.color]="stat.color">
              <span [innerHTML]="stat.icon | safeHtml"></span>
            </div>
            <div>
              <div class="stat-label-admin">{{ stat.label }}</div>
              @if (loading()) {
                <div class="skeleton" style="width:60px;height:28px"></div>
              } @else {
                <div class="stat-value-admin">{{ stat.value }}</div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Quick Admin Actions -->
      <div class="admin-actions-row animate-fade-in-up stagger-3">
        <a routerLink="/admin/users" class="admin-action-card card" id="admin-users-link">
          <div class="admin-action-icon" style="background:rgba(108,99,255,0.12);color:var(--color-primary)">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div class="admin-action-info">
            <strong>User Management</strong>
            <span>View and manage all users</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      </div>

      <!-- Recent Users -->
      <div class="animate-fade-in-up stagger-4">
        <div class="section-header" style="margin-bottom:1rem">
          <h2 class="section-title" style="font-size:var(--font-size-lg)">Recent Users</h2>
          <a routerLink="/admin/users" class="btn btn--ghost btn--sm" id="view-all-users-admin">View all</a>
        </div>

        @if (loading()) {
          <div class="table-wrapper">
            <table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>
              @for (i of [1,2,3]; track i) {
                <tr><td colspan="4"><div class="skeleton" style="height:20px;border-radius:4px"></div></td></tr>
              }
            </tbody></table>
          </div>
        } @else {
          <div class="table-wrapper">
            <table aria-label="Recent users">
              <thead>
                <tr><th>User</th><th>Role</th><th>Status</th><th>Balance</th><th>Joined</th></tr>
              </thead>
              <tbody>
                @for (u of users().slice(0,5); track u.id) {
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:0.75rem">
                        <div class="user-mini-avatar">{{ u.fullName[0] }}</div>
                        <div>
                          <div style="font-weight:600;font-size:var(--font-size-sm)">{{ u.fullName }}</div>
                          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">{{ u.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge" [class]="u.role==='Admin'?'badge--info':'badge--neutral'">{{ u.role }}</span></td>
                    <td><span class="badge" [class]="u.isActive?'badge--success':'badge--danger'">{{ u.isActive ? 'Active':'Disabled' }}</span></td>
                    <td style="font-weight:600;color:var(--color-accent)">{{ u.balance | currency: (u.currency || 'USD') }}</td>
                    <td style="font-size:var(--font-size-xs);color:var(--color-text-muted)">{{ u.createdAt | date:'mediumDate' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; }
    .admin-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .admin-stat-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; }
    .stat-icon-admin { width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-label-admin { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.25rem; }
    .stat-value-admin { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-text); }

    .admin-actions-row { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
    .admin-action-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; text-decoration: none; color: var(--color-text); flex: 1; min-width: 260px; cursor: pointer;
      transition: all var(--transition-fast);
      &:hover { border-color: var(--color-primary); background: var(--color-surface-2); transform: translateY(-1px); }
    }
    .admin-action-icon { width: 52px; height: 52px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .admin-action-info { flex: 1;
      strong { display: block; font-size: var(--font-size-sm); font-weight: 700; margin-bottom: 0.2rem; }
      span { font-size: var(--font-size-xs); color: var(--color-text-muted); }
    }

    .section-header { display: flex; align-items: center; justify-content: space-between; }
    .section-title { margin-bottom: 0; }

    .user-mini-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 700; color: #fff; flex-shrink: 0; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  users   = signal<AdminUser[]>([]);
  loading = signal(true);

  stats = () => [
    {
      label: 'Total Users', value: this.users().length.toString(),
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
      color: '#6C63FF',
    },
    {
      label: 'Active Users', value: this.users().filter(u => u.isActive).length.toString(),
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      color: '#00D4AA',
    },
    {
      label: 'Admins', value: this.users().filter(u => u.role === 'Admin').length.toString(),
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      color: '#60A5FA',
    },
    {
      label: 'Disabled', value: this.users().filter(u => !u.isActive).length.toString(),
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
      color: '#FF5A7E',
    },
  ];

  ngOnInit(): void {
    this.http.get<AdminUser[]>(`${environment.apiUrl}/admin/users`).subscribe({
      next: u  => { this.users.set(u);  this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
