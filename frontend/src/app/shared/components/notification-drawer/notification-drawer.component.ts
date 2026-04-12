import { Component, EventEmitter, Input, Output, inject, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationDataService } from '../../../core/services/notification-data.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { Notification } from '../../../core/models/models';
import { Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-notification-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-overlay" [class.open]="show" (click)="onClose()">
      <div class="notif-sidebar" [class.open]="show" (click)="$event.stopPropagation()">
        
        <!-- Premium Header -->
        <div class="notif-header">
          <div class="header-text">
            <h2>Notifications</h2>
            <p>Stay updated with your account activity</p>
          </div>
          <button class="close-btn" (click)="onClose()" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="notif-actions" *ngIf="notifications.length > 0">
           <button class="mark-all-btn" (click)="markAllAsRead()">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
             Mark all as read
           </button>
        </div>

        <!-- content Scroll Area -->
        <div class="notif-scroll-area custom-scrollbar">
          @if (loading && notifications.length === 0) {
            <div class="notif-state">
              <div class="shimmer-card"></div>
              <div class="shimmer-card"></div>
              <div class="shimmer-card"></div>
            </div>
          } @else if (notifications.length === 0) {
            <div class="notif-state empty">
              <div class="empty-plate">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              </div>
              <h3>Nothing to show</h3>
              <p>When you have activity, you'll see it here.</p>
            </div>
          } @else {
            <div class="notif-list">
              @for (n of notifications; track n.id; let i = $index) {
                <div class="notif-row animate-in" 
                     [class.unread]="!n.isRead" 
                     (click)="markAsRead(n)"
                     [style.animation-delay]="(i * 0.05) + 's'">
                  <div class="notif-type-icon" [ngClass]="getNotifType(n)">
                    <span [innerHTML]="getNotifIcon(n)"></span>
                  </div>
                  <div class="notif-content">
                    <div class="notif-row-top">
                      <span class="notif-title">{{ n.title }}</span>
                      <span class="unread-mark" *ngIf="!n.isRead"></span>
                    </div>
                    <p class="notif-message">{{ n.message }}</p>
                    <span class="notif-date">{{ n.createdAt | date: 'h:mm a, MMM d' }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notif-overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
      z-index: 9999;
      opacity: 0; pointer-events: none;
      transition: all 0.4s ease;
      &.open { opacity: 1; pointer-events: auto; }
    }

    .notif-sidebar {
      position: fixed; top: 0; right: -420px; bottom: 0;
      width: 100%; max-width: 420px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(25px) saturate(150%);
      -webkit-backdrop-filter: blur(25px) saturate(150%);
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: -20px 0 50px rgba(0,0,0,0.4);
      display: flex; flex-direction: column;
      transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      &.open { right: 0; }
    }

    .notif-header {
      padding: 2.5rem 2rem 1.5rem;
      display: flex; align-items: flex-start; justify-content: space-between;
      h2 { font-size: 1.5rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem 0; }
      p { color: rgba(255,255,255,0.5); font-size: 0.85rem; margin: 0; }
    }

    .close-btn {
      width: 40px; height: 40px; border-radius: 50%; border: none;
      background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
      &:hover { background: #FF5A7E; color: #fff; transform: rotate(90deg); }
    }

    .notif-actions { 
      padding: 0 2rem 1rem;
      .mark-all-btn { 
        background: none; border: none; color: var(--color-primary); font-size: 0.85rem; font-weight: 600; 
        display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem 0;
        &:hover { color: #8B85FF; text-decoration: underline; }
      }
    }

    .notif-scroll-area { flex: 1; overflow-y: auto; padding: 0 1.5rem 2rem; }
    .notif-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .notif-row {
      display: flex; gap: 1.25rem; padding: 1.25rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 1.25rem;
      cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); transform: translateX(-4px); }
      &.unread { 
        background: rgba(108, 99, 255, 0.05); 
        border-color: rgba(108, 99, 255, 0.2);
        &:hover { background: rgba(108, 99, 255, 0.08); }
      }
    }

    .notif-type-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; color: #fff;
      &.deposit { background: linear-gradient(135deg, #00D4AA, #00B894); }
      &.transfer { background: linear-gradient(135deg, #6C63FF, #8B85FF); }
      &.alert { background: linear-gradient(135deg, #FF5A7E, #F93131); }
      &.default { background: #334155; }
    }

    .notif-content { flex: 1; min-width: 0; }
    .notif-row-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
    .notif-title { font-weight: 700; color: #fff; font-size: 0.95rem; }
    .notif-message { color: rgba(255,255,255,0.6); font-size: 0.85rem; line-height: 1.5; margin: 0 0 0.5rem 0; }
    .notif-date { color: rgba(255,255,255,0.3); font-size: 0.75rem; font-weight: 500; }
    .unread-mark { width: 8px; height: 8px; background: var(--color-primary); border-radius: 50%; box-shadow: 0 0 10px var(--color-primary); }

    .shimmer-card { height: 80px; background: rgba(255,255,255,0.03); border-radius: 1rem; margin-bottom: 1rem; }
    .notif-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; text-align: center; opacity: 0.6; }

    @keyframes fadeInSlide { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    .animate-in { animation: fadeInSlide 0.4s ease-out both; }

    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
  `]
})
export class NotificationDrawerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() show = false;
  @Output() close = new EventEmitter<void>();

  private dataSvc = inject(NotificationDataService);
  private signalrSvc = inject(SignalrService);
  
  notifications: Notification[] = [];
  loading = true;
  private newNotif$ = toObservable(this.signalrSvc.newNotification);
  private sub?: Subscription;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['show']?.currentValue === true) {
      this.load();
    }
  }

  ngOnInit() {
    this.load();
    this.sub = this.newNotif$.subscribe(n => {
      if (n && !this.notifications.some(x => x.id === n.id)) {
        this.notifications = [n, ...this.notifications];
      }
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  load() {
    this.loading = true;
    this.dataSvc.getNotifications(20).subscribe({
      next: data => { this.notifications = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  markAsRead(n: Notification) {
    if (n.isRead) return;
    this.dataSvc.markAsRead(n.id).subscribe(() => n.isRead = true);
  }

  markAllAsRead() {
    this.notifications.filter(n => !n.isRead).forEach(n => this.markAsRead(n));
  }

  getNotifType(n: Notification): string {
    const t = n.title.toLowerCase();
    const m = n.message.toLowerCase();
    if (t.includes('deposit') || m.includes('deposited')) return 'deposit';
    if (t.includes('transfer') || m.includes('received')) return 'transfer';
    if (t.includes('alert') || t.includes('security')) return 'alert';
    return 'default';
  }

  getNotifIcon(n: Notification): string {
    const type = this.getNotifType(n);
    if (type === 'deposit') return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
    if (type === 'transfer') return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
    if (type === 'alert') return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>';
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>';
  }

  onClose() { this.close.emit(); }
}
