import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [NgIf, NgClass],
  template: `
    <div class="modal-backdrop animate-fade-in" *ngIf="show">
      <div class="modal-container animate-scale-up">
        <div class="modal-content">
          <div class="modal-icon" [style.background]="getIconBg()">
            <span [innerHTML]="icon"></span>
          </div>
          <h2 class="modal-title">{{ title }}</h2>
          <p class="modal-message">{{ message }}</p>
          
          <div class="modal-actions">
            <button class="btn btn--outline" (click)="onCancel()" id="modal-cancel-btn">
              {{ cancelText }}
            </button>
            <button class="btn" [ngClass]="confirmClass" (click)="onConfirm()" id="modal-confirm-btn">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1.5rem;
    }
    .modal-container {
      width: 100%;
      max-width: 400px;
      background: var(--color-surface);
      border: 1px solid var(--color-border-soft);
      border-radius: var(--radius-2xl);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }
    .modal-content {
      padding: 2.5rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .modal-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      color: #fff;
      svg { width: 32px; height: 32px; }
    }
    .modal-title {
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 0.75rem;
    }
    .modal-message {
      font-size: var(--font-size-md);
      color: var(--color-text-muted);
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .modal-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      width: 100%;
    }
    .btn--danger { background: var(--color-danger); color: #fff; &:hover { background: #dc2626; } }
    .btn--primary { background: var(--color-primary); color: #fff; &:hover { background: var(--color-primary-hover); } }
  `]
})
export class ConfirmModalComponent {
  @Input() show = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() confirmClass = 'btn--primary';
  @Input() icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  @Input() iconType: 'warning' | 'danger' | 'info' = 'info';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  getIconBg() {
    return {
      warning: 'var(--color-warning)',
      danger: 'var(--color-danger)',
      info: 'var(--color-primary)'
    }[this.iconType];
  }

  onConfirm() { this.confirm.emit(); }
  onCancel() { this.cancel.emit(); }
}
