import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AdminUser } from '../../../core/models/models';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-nav animate-fade-in-up stagger-1">
        <a routerLink="/admin" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Admin
        </a>
      </div>

      <div class="page-header animate-fade-in-up stagger-2">
        <h1>User Management</h1>
        <p>{{ filtered().length }} of {{ users().length }} users</p>
      </div>

      <!-- Search & Filters -->
      <div class="ums-toolbar card animate-fade-in-up stagger-3">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" [(ngModel)]="searchQuery" placeholder="Search by name or email…" id="user-search" (input)="applyFilter()" />
        </div>
        <div class="filter-chips">
          @for (r of roleFilters; track r.value) {
            <button class="filter-chip" [class.active]="roleFilter() === r.value" (click)="roleFilter.set(r.value); applyFilter()">{{ r.label }}</button>
          }
        </div>
      </div>

      <!-- Table -->
      <div class="animate-fade-in-up stagger-4">
        @if (loading()) {
          <div class="table-wrapper">
            <table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Balance</th><th>Member Since</th><th>Actions</th></tr></thead>
            <tbody>
              @for (i of [1,2,3,4,5]; track i) {
                <tr><td colspan="6"><div class="skeleton" style="height:20px"></div></td></tr>
              }
            </tbody></table>
          </div>
        } @else if (!filtered().length) {
          <div class="empty-state card">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.25"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <h3>No users found</h3>
            <p>Try adjusting your search or filter</p>
          </div>
        } @else {
          <div class="table-wrapper">
            <table aria-label="All users">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Balance</th>
                  <th>Member Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of filtered(); track u.id) {
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
                    <td>
                      <span class="badge" [class]="u.role==='Admin'?'badge--info':'badge--neutral'">{{ u.role }}</span>
                    </td>
                    <td>
                      <span class="badge" [class]="u.isActive?'badge--success':'badge--danger'">
                        {{ u.isActive ? 'Active' : 'Disabled' }}
                      </span>
                    </td>
                    <td style="font-weight:600;color:var(--color-accent)">
                      {{ (u.balance ?? 0) | currency: (u.currency || 'USD') }}
                    </td>
                    <td style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
                      {{ u.createdAt | date:'mediumDate' }}
                    </td>
                    <td>
                      <div style="display:flex;gap:0.5rem">
                        <button class="btn btn--ghost btn--sm"
                          [id]="'toggle-user-' + u.id.slice(0,6)"
                          (click)="toggleUser(u)"
                          [class]="u.isActive ? 'btn--ghost' : 'btn--outline'"
                          [title]="u.isActive ? 'Disable user' : 'Enable user'">
                          {{ u.isActive ? 'Disable' : 'Enable' }}
                        </button>
                      </div>
                    </td>
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
    .page { max-width: 1100px; }
    .page-nav { margin-bottom: 1.5rem; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--color-text-muted); font-size: var(--font-size-sm); font-weight: 500; text-decoration: none; transition: color var(--transition-fast); &:hover { color: var(--color-primary); } }

    .ums-toolbar { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; padding: 1rem 1.25rem; }
    .search-box {
      display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 200px;
      background: var(--color-surface-2); border: 1px solid var(--color-border-soft); border-radius: var(--radius-md); padding: 0.5rem 1rem;
      color: var(--color-text-muted);
      &:focus-within { border-color: var(--color-primary); }
      input { background: none; border: none; outline: none; color: var(--color-text); font-size: var(--font-size-sm); width: 100%; &::placeholder { color: var(--color-text-faint); } }
    }
    .filter-chips { display: flex; gap: 0.5rem; }
    .filter-chip { padding: 0.3rem 0.875rem; border-radius: var(--radius-full); border: 1px solid var(--color-border-soft); background: transparent; color: var(--color-text-muted); font-size: var(--font-size-xs); font-weight: 500; cursor: pointer; transition: all var(--transition-fast);
      &:hover { border-color: var(--color-primary); color: var(--color-primary); }
      &.active { background: var(--color-primary-light); border-color: var(--color-primary); color: var(--color-primary); font-weight: 600; }
    }
    .user-mini-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 700; color: #fff; flex-shrink: 0; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; text-align: center; h3 { font-size: var(--font-size-lg); } }
  `]
})
export class UserManagementComponent implements OnInit {
  private http   = inject(HttpClient);
  private notify = inject(NotificationService);

  users       = signal<AdminUser[]>([]);
  filtered    = signal<AdminUser[]>([]);
  loading     = signal(true);
  searchQuery = '';
  roleFilter  = signal('all');

  roleFilters = [
    { label: 'All',   value: 'all'   },
    { label: 'Users', value: 'User'  },
    { label: 'Admins',value: 'Admin' },
  ];

  applyFilter(): void {
    let list = this.users();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (this.roleFilter() !== 'all') list = list.filter(u => u.role === this.roleFilter());
    this.filtered.set(list);
  }

  toggleUser(u: AdminUser): void {
    // Optimistic update
    u.isActive = !u.isActive;
    this.applyFilter();
    this.notify.info(`User ${u.isActive ? 'enabled' : 'disabled'}`, u.fullName);
  }

  ngOnInit(): void {
    this.http.get<AdminUser[]>(`${environment.apiUrl}/admin/users`).subscribe({
      next: list => { this.users.set(list); this.filtered.set(list); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }
}
