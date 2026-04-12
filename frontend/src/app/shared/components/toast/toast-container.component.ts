import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { NotificationService, Toast } from '../../../core/services/notification.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgClass, SafeHtmlPipe],
  animations: [
    trigger('toastAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ],
  template: `
    <div class="toast-container" aria-live="polite" aria-label="Notifications">
      @for (toast of notify.toasts(); track toast.id) {
        <div class="toast" [@toastAnim] [ngClass]="'toast--' + toast.type" role="alert">
          <span class="toast-icon" [innerHTML]="getIcon(toast.type) | safeHtml"></span>
          <div class="toast-body">
            <strong class="toast-title">{{ toast.title }}</strong>
            @if (toast.message) {
              <span class="toast-message">{{ toast.message }}</span>
            }
          </div>
          <button class="toast-close" (click)="notify.dismiss(toast.id)" aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div class="toast-progress" [style.animation-duration]="toast.duration + 'ms'"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem; right: 1.5rem;
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 380px;
      width: calc(100vw - 3rem);
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1rem 1.25rem;
      border-radius: var(--radius-lg);
      background: var(--color-surface-2);
      border: 1px solid var(--color-border-soft);
      box-shadow: var(--shadow-lg);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(16px);

      &--success { border-left: 3px solid var(--color-success); .toast-icon { color: var(--color-success); } }
      &--error   { border-left: 3px solid var(--color-danger);  .toast-icon { color: var(--color-danger);  } }
      &--warning { border-left: 3px solid var(--color-warning); .toast-icon { color: var(--color-warning); } }
      &--info    { border-left: 3px solid var(--color-info);    .toast-icon { color: var(--color-info);    } }
    }
    .toast-icon { flex-shrink: 0; margin-top: 1px; }
    .toast-body { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .toast-title { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); }
    .toast-message { font-size: var(--font-size-xs); color: var(--color-text-muted); }
    .toast-close {
      background: none; border: none; cursor: pointer;
      color: var(--color-text-faint); padding: 0.125rem;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
      &:hover { color: var(--color-text); }
    }
    .toast-progress {
      position: absolute;
      bottom: 0; left: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
      animation: toastProgress linear forwards;
      width: 100%;
    }
    @keyframes toastProgress {
      from { width: 100%; }
      to   { width: 0%; }
    }
  `]
})
export class ToastContainerComponent {
  notify = inject(NotificationService);

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>',
    };
    return icons[type] ?? icons['info'];
  }
}
