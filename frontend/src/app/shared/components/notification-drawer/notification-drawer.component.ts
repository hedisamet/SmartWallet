import {
  Component, EventEmitter, Input, Output,
  inject, OnInit, OnDestroy, OnChanges, SimpleChanges,
  signal, computed
} from '@angular/core';
import { NgClass } from '@angular/common';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { NotificationDataService } from '../../../core/services/notification-data.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { Notification } from '../../../core/models/models';
import { Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

type Tab = 'all' | 'unread';

@Component({
  selector: 'app-notification-drawer',
  standalone: true,
  imports: [NgClass, SafeHtmlPipe],
  template: `
    <div class="nd-backdrop" [class.nd-backdrop--open]="show" (click)="onClose()"></div>

    <div class="nd-panel" [class.nd-panel--open]="show">

      <!-- Header -->
      <div class="nd-header">
        <span class="nd-header__title">Notifications</span>
        <div class="nd-header__actions">
          @if (unreadCount() > 0) {
            <button class="nd-btn-markall" (click)="markAllAsRead()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12l6 6L22 4"/></svg>
              Mark all read
            </button>
          }
          <button class="nd-btn-close" (click)="onClose()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="nd-tabs">
        <button class="nd-tab" [class.nd-tab--active]="tab() === 'all'" (click)="tab.set('all')">All</button>
        <button class="nd-tab" [class.nd-tab--active]="tab() === 'unread'" (click)="tab.set('unread')">
          Unread
          @if (unreadCount() > 0) {
            <span class="nd-tab__badge">{{ unreadCount() }}</span>
          }
        </button>
      </div>

      <div class="nd-body">

        @if (loading() && notifications().length === 0) {
          @for (s of [1,2,3]; track s) {
            <div class="nd-skeleton">
              <div class="nd-skeleton__avatar"></div>
              <div class="nd-skeleton__lines">
                <div class="nd-skeleton__line" style="width:50%"></div>
                <div class="nd-skeleton__line" style="width:80%"></div>
                <div class="nd-skeleton__line" style="width:30%"></div>
              </div>
            </div>
          }

        } @else if (visible().length === 0) {
          <div class="nd-empty">
            <div class="nd-empty__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <p class="nd-empty__title">{{ tab() === 'unread' ? "All caught up!" : "No notifications" }}</p>
            <p class="nd-empty__sub">{{ tab() === 'unread' ? "No unread notifications." : "Activity will appear here." }}</p>
          </div>

        } @else {
          @if (groupedItems().today.length > 0) {
            <p class="nd-group-label">Today</p>
            @for (n of groupedItems().today; track n.id) {
              <div class="nd-item" [class.nd-item--unread]="!n.isRead" (click)="markAsRead(n)">
                <div class="nd-item__avatar-wrap">
                  <div class="nd-item__avatar" [ngClass]="'nd-item__avatar--' + typeOf(n)">
                    <span [innerHTML]="iconOf(n) | safeHtml"></span>
                  </div>
                  <div class="nd-item__dot" [ngClass]="'nd-item__dot--' + typeOf(n)">
                    <span [innerHTML]="dotIconOf(n) | safeHtml"></span>
                  </div>
                </div>
                <div class="nd-item__body">
                  <p class="nd-item__title">{{ n.title }}</p>
                  <p class="nd-item__msg" [style.color]="!n.isRead ? '#e2e8f0' : '#94a3b8'">{{ n.message }}</p>
                  <span class="nd-item__time" [style.color]="!n.isRead ? '#818cf8' : '#64748b'">{{ relTime(n.createdAt) }}</span>
                </div>
                @if (!n.isRead) {
                  <span class="nd-item__unread-dot"></span>
                }
                <div class="nd-item__actions">
                  @if (!n.isRead) {
                    <button class="nd-item__action-btn" (click)="$event.stopPropagation(); markAsRead(n)" title="Mark as read">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    </button>
                  }
                  <button class="nd-item__action-btn nd-item__action-btn--dismiss" (click)="$event.stopPropagation(); dismiss(n)" title="Dismiss">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            }
          }

          @if (groupedItems().earlier.length > 0) {
            <p class="nd-group-label">Earlier</p>
            @for (n of groupedItems().earlier; track n.id) {
              <div class="nd-item" [class.nd-item--unread]="!n.isRead" (click)="markAsRead(n)">
                <div class="nd-item__avatar-wrap">
                  <div class="nd-item__avatar" [ngClass]="'nd-item__avatar--' + typeOf(n)">
                    <span [innerHTML]="iconOf(n) | safeHtml"></span>
                  </div>
                  <div class="nd-item__dot" [ngClass]="'nd-item__dot--' + typeOf(n)">
                    <span [innerHTML]="dotIconOf(n) | safeHtml"></span>
                  </div>
                </div>
                <div class="nd-item__body">
                  <p class="nd-item__title">{{ n.title }}</p>
                  <p class="nd-item__msg" [style.color]="!n.isRead ? '#e2e8f0' : '#94a3b8'">{{ n.message }}</p>
                  <span class="nd-item__time" [style.color]="!n.isRead ? '#818cf8' : '#64748b'">{{ relTime(n.createdAt) }}</span>
                </div>
                @if (!n.isRead) {
                  <span class="nd-item__unread-dot"></span>
                }
                <div class="nd-item__actions">
                  @if (!n.isRead) {
                    <button class="nd-item__action-btn" (click)="$event.stopPropagation(); markAsRead(n)" title="Mark as read">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    </button>
                  }
                  <button class="nd-item__action-btn nd-item__action-btn--dismiss" (click)="$event.stopPropagation(); dismiss(n)" title="Dismiss">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            }
          }
        }

      </div>
    </div>
  `,
  styles: [`
    /* ── Backdrop ─────────────────────────────────────────────────── */
    .nd-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9998;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    .nd-backdrop--open {
      opacity: 1;
      pointer-events: auto;
    }

    /* ── Panel ────────────────────────────────────────────────────── */
    .nd-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 420px;
      max-width: 100vw;
      background: #111827;
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: -16px 0 48px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      z-index: 9999;
      transform: translateX(100%);
      transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .nd-panel--open {
      transform: translateX(0);
    }

    /* ── Header ───────────────────────────────────────────────────── */
    .nd-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.25rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      flex-shrink: 0;
    }
    .nd-header__title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .nd-header__actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .nd-btn-markall {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.75rem;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.25);
      color: #a5b4fc;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .nd-btn-markall:hover {
      background: rgba(99, 102, 241, 0.25);
    }
    .nd-btn-close {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nd-btn-close:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.35);
      color: #f87171;
      transform: rotate(90deg);
    }

    /* ── Tabs ─────────────────────────────────────────────────────── */
    .nd-tabs {
      display: flex;
      gap: 0.25rem;
      padding: 0.625rem 1.25rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      flex-shrink: 0;
    }
    .nd-tab {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.875rem;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px 8px 0 0;
      position: relative;
      transition: color 0.2s;
    }
    .nd-tab:not(.nd-tab--active):hover {
      color: rgba(255, 255, 255, 0.7);
    }
    .nd-tab--active {
      color: #a5b4fc;
    }
    .nd-tab--active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: #6366f1;
      border-radius: 2px 2px 0 0;
    }
    .nd-tab__badge {
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 999px;
      background: #6366f1;
      color: #ffffff;
      font-size: 0.68rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ── Body ─────────────────────────────────────────────────────── */
    .nd-body {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 1.5rem;
    }
    .nd-body::-webkit-scrollbar { width: 4px; }
    .nd-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

    /* ── Skeleton ─────────────────────────────────────────────────── */
    .nd-skeleton {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.25rem;
    }
    .nd-skeleton__avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.07);
      animation: nd-pulse 1.5s ease-in-out infinite;
    }
    .nd-skeleton__lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 0.25rem;
    }
    .nd-skeleton__line {
      height: 10px;
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.07);
      animation: nd-pulse 1.5s ease-in-out infinite;
    }
    @keyframes nd-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.9; }
    }

    /* ── Empty ────────────────────────────────────────────────────── */
    .nd-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }
    .nd-empty__icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.25);
      margin-bottom: 1rem;
    }
    .nd-empty__title {
      font-size: 0.95rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.6);
      margin: 0 0 0.35rem;
    }
    .nd-empty__sub {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.3);
      margin: 0;
    }

    /* ── Group label ──────────────────────────────────────────────── */
    .nd-group-label {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.35);
      padding: 1.25rem 1.25rem 0.5rem;
      margin: 0;
    }

    /* ── Notification item ────────────────────────────────────────── */
    .nd-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .nd-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .nd-item:hover .nd-item__actions {
      opacity: 1;
      pointer-events: auto;
    }
    .nd-item--unread {
      background: rgba(99, 102, 241, 0.09);
    }
    .nd-item--unread:hover {
      background: rgba(99, 102, 241, 0.15);
    }

    /* ── Avatar ───────────────────────────────────────────────────── */
    .nd-item__avatar-wrap {
      position: relative;
      flex-shrink: 0;
    }
    .nd-item__avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
    .nd-item__avatar--deposit  { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .nd-item__avatar--transfer { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
    .nd-item__avatar--alert    { background: rgba(239,  68,  68, 0.2); color: #f87171; }
    .nd-item__avatar--default  { background: rgba(255, 255, 255, 0.08); color: rgba(255,255,255,0.5); }

    .nd-item__dot {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      border: 2px solid #111827;
    }
    .nd-item__dot--deposit  { background: #10b981; color: #fff; }
    .nd-item__dot--transfer { background: #6366f1; color: #fff; }
    .nd-item__dot--alert    { background: #ef4444; color: #fff; }
    .nd-item__dot--default  { background: #475569; color: #fff; }

    /* ── Content ──────────────────────────────────────────────────── */
    .nd-item__body {
      flex: 1;
      min-width: 0;
      padding-right: 1.5rem;
    }
    .nd-item__title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nd-item__msg {
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 6px;
      word-break: break-word;
    }
    .nd-item__time {
      font-size: 12px;
      font-weight: 600;
    }

    /* ── Unread indicator dot ─────────────────────────────────────── */
    .nd-item__unread-dot {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #6366f1;
      box-shadow: 0 0 8px rgba(99, 102, 241, 0.8);
      flex-shrink: 0;
    }

    /* ── Hover action buttons ─────────────────────────────────────── */
    .nd-item__actions {
      position: absolute;
      right: 0.625rem;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      gap: 0.2rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s;
      background: #1f2937;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 2px;
    }
    .nd-item__action-btn {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      cursor: pointer;
      transition: background 0.15s;
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
    }
    .nd-item__action-btn:hover {
      background: rgba(99, 102, 241, 0.3);
    }
    .nd-item__action-btn--dismiss {
      background: transparent;
      color: rgba(255, 255, 255, 0.4);
    }
    .nd-item__action-btn--dismiss:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }
  `]
})
export class NotificationDrawerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() show = false;
  @Output() close = new EventEmitter<void>();

  private dataSvc    = inject(NotificationDataService);
  private signalrSvc = inject(SignalrService);

  notifications = signal<Notification[]>([]);
  loading       = signal(true);
  tab           = signal<Tab>('all');

  private sub?: Subscription;
  private newNotif$ = toObservable(this.signalrSvc.newNotification);

  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  visible = computed(() => {
    const all = this.notifications();
    return this.tab() === 'unread' ? all.filter(n => !n.isRead) : all;
  });

  groupedItems = computed(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today: Notification[] = [], earlier: Notification[] = [];
    for (const n of this.visible()) {
      (new Date(n.createdAt) >= todayStart ? today : earlier).push(n);
    }
    return { today, earlier };
  });

  ngOnChanges(c: SimpleChanges) {
    if (c['show']?.currentValue === true) this.load();
  }

  ngOnInit() {
    this.sub = this.newNotif$.subscribe(n => {
      if (n && !this.notifications().some(x => x.id === n.id))
        this.notifications.update(list => [n, ...list]);
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  load() {
    this.loading.set(true);
    this.dataSvc.getNotifications(20).subscribe({
      next:  d  => { this.notifications.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  markAsRead(n: Notification) {
    if (n.isRead) return;
    this.dataSvc.markAsRead(n.id).subscribe(() =>
      this.notifications.update(list => list.map(x => x.id === n.id ? { ...x, isRead: true } : x))
    );
  }

  markAllAsRead() { this.notifications().filter(n => !n.isRead).forEach(n => this.markAsRead(n)); }
  dismiss(n: Notification) { this.notifications.update(list => list.filter(x => x.id !== n.id)); }

  typeOf(n: Notification): string {
    const t = n.title.toLowerCase(), m = n.message.toLowerCase();
    if (t.includes('deposit')  || m.includes('deposit'))   return 'deposit';
    if (t.includes('transfer') || t.includes('received')
     || m.includes('received') || m.includes('sent'))      return 'transfer';
    if (t.includes('alert')    || t.includes('security'))  return 'alert';
    return 'default';
  }

  iconOf(n: Notification): string {
    switch (this.typeOf(n)) {
      case 'deposit':  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>`;
      case 'transfer': return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      case 'alert':    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>`;
      default:         return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>`;
    }
  }

  dotIconOf(n: Notification): string {
    switch (this.typeOf(n)) {
      case 'deposit':  return `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12l7 7 7-7"/></svg>`;
      case 'transfer': return `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      case 'alert':    return `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="7" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      default:         return `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9"/></svg>`;
    }
  }

  relTime(dateStr: string): string {
    const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (sec <     60) return 'just now';
    if (sec <   3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec <  86400) return `${Math.floor(sec / 3600)}h ago`;
    if (sec < 172800) return 'Yesterday';
    if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  onClose() { this.close.emit(); }
}
