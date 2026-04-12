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
            <p>Your workspace is up to date</p>
          </div>
          <button class="close-btn" (click)="onClose()" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="notif-actions" *ngIf="notifications.length > 0">
           <button class="mark-all-btn" (click)="markAllAsRead()">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
             Mark as read
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
              <div class="empty-icon-box">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              </div>
              <h3>Nothing to show yet</h3>
              <p>When you have activity, it'll appear here.</p>
            </div>
          } @else {
            <div class="notif-list">
              @for (n of notifications; track n.id; let i = $index) {
                <div class="aura-card" 
                     [class.unread]="!n.isRead" 
                     (click)="markAsRead(n)"
                     [style.animation-delay]="(i * 0.05) + 's'">
                  
                  <div class="card-aura" [ngClass]="getNotifType(n)"></div>
                  
                  <div class="orb-container">
                    <div class="gradient-orb" [ngClass]="getNotifType(n)">
                      <div class="orb-icon" [innerHTML]="getNotifIcon(n)"></div>
                    </div>
                  </div>

                  <div class="notif-body">
                    <div class="notif-main-row">
                      <span class="notif-title">{{ n.title }}</span>
                      <div class="pearl-indicator" [class.active]="!n.isRead"></div>
                    </div>
                    <p class="notif-msg">{{ n.message }}</p>
                    <div class="notif-meta">
                      <span class="notif-time">{{ n.createdAt | date: 'h:mm a · MMM d' }}</span>
                    </div>
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
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      z-index: 10000;
      opacity: 0; pointer-events: none;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      &.open { opacity: 1; pointer-events: auto; }
    }

    .notif-sidebar {
      position: fixed; top: 0; right: -460px; bottom: 0;
      width: 100%; max-width: 440px;
      background: rgba(10, 14, 26, 0.92);
      backdrop-filter: blur(40px) saturate(160%);
      -webkit-backdrop-filter: blur(40px) saturate(160%);
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: -40px 0 100px rgba(0,0,0,0.6);
      display: flex; flex-direction: column;
      transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
      &.open { right: 0; }
    }

    .notif-header {
      padding: 3rem 2.5rem 1.5rem;
      display: flex; align-items: flex-start; justify-content: space-between;
      h2 { font-size: 1.75rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem 0; letter-spacing: -0.02em; }
      p { color: rgba(255,255,255,0.4); font-size: 0.9rem; margin: 0; }
    }

    .close-btn {
      width: 44px; height: 44px; border-radius: 16px; border: none;
      background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.3s;
      &:hover { background: #FF4D4D; color: #fff; transform: scale(1.1) rotate(90deg); }
    }

    .notif-actions { 
      padding: 0 2.5rem 1.5rem;
      .mark-all-btn { 
        background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.08); 
        color: rgba(255,255,255,0.8); font-size: 0.85rem; font-weight: 600; border-radius: 12px;
        display: flex; align-items: center; gap: 0.6rem; cursor: pointer; padding: 0.6rem 1rem;
        transition: all 0.3s;
        &:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
      }
    }

    .notif-scroll-area { flex: 1; overflow-y: auto; padding: 0 1.5rem 3rem; }
    .notif-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .aura-card {
      position: relative;
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 20px;
      padding: 1.5rem;
      display: flex; gap: 1.25rem;
      cursor: pointer; transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      animation: springSlideIn 0.7s cubic-bezier(0.18, 0.89, 0.32, 1.28) both;
      overflow: hidden;

      &:hover { background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.1); transform: translateX(-8px) scale(1.01); }
      &.unread { 
        background: rgba(108, 99, 255, 0.04); 
        border-color: rgba(108, 99, 255, 0.15);
      }
    }

    .card-aura {
      position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.01) 0%, transparent 70%);
      pointer-events: none; transition: opacity 0.5s;
      &.deposit { background: radial-gradient(circle, rgba(0, 212, 170, 0.06) 0%, transparent 70%); }
      &.transfer { background: radial-gradient(circle, rgba(108, 99, 255, 0.06) 0%, transparent 70%); }
      &.alert { background: radial-gradient(circle, rgba(255, 77, 77, 0.06) 0%, transparent 70%); }
    }

    .orb-container { position: relative; z-index: 2; }
    .gradient-orb {
      width: 52px; height: 52px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
      &::before { content: ''; position: absolute; inset: 0; background: currentColor; opacity: 0.1; }
      
      &.deposit { color: #00D4AA; background: linear-gradient(135deg, rgba(0,212,170,0.4), rgba(0,184,148,0.2)); }
      &.transfer { color: #6C63FF; background: linear-gradient(135deg, rgba(108,99,255,0.4), rgba(139,133,255,0.2)); }
      &.alert { color: #FF4D4D; background: linear-gradient(135deg, rgba(255,77,77,0.4), rgba(249,49,49,0.2)); }
      &.default { color: #94A3B8; background: rgba(255,255,255,0.05); }
    }

    .orb-icon { color: #fff; filter: drop-shadow(0 0 8px currentColor); }

    .notif-body { flex: 1; min-width: 0; position: relative; z-index: 2; }
    .notif-main-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
    .notif-title { font-weight: 700; color: #fff; font-size: 1rem; letter-spacing: -0.01em; }
    .notif-msg { color: rgba(255,255,255,0.6); font-size: 0.9rem; line-height: 1.5; margin: 0 0 0.75rem 0; }
    .notif-meta { display: flex; align-items: center; gap: 0.75rem; }
    .notif-time { color: rgba(255,255,255,0.3); font-size: 0.75rem; font-weight: 500; }
    
    .pearl-indicator { 
      width: 8px; height: 8px; border-radius: 50%; background: #fff; 
      opacity: 0; transition: all 0.3s;
      &.active { opacity: 1; box-shadow: 0 0 12px #fff; }
    }

    .notif-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; text-align: center; }
    .empty-icon-box { background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 50%; margin-bottom: 1.5rem; }

    .shimmer-card { height: 100px; background: rgba(255,255,255,0.02); border-radius: 20px; margin-bottom: 1rem; position: relative; overflow: hidden;
      &::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent); animation: shimmer 2s infinite; }
    }

    @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
    @keyframes springSlideIn { from { opacity: 0; transform: translateX(40px) scale(0.95); } to { opacity: 1; transform: translateX(0) scale(1); } }

    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
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
    if (type === 'deposit') return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
    if (type === 'transfer') return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
    if (type === 'alert') return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>';
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>';
  }

  onClose() { this.close.emit(); }
}
