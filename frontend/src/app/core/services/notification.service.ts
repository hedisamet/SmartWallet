import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly toasts = signal<Toast[]>([]);

  show(type: ToastType, title: string, message?: string, duration = 4000): void {
    const id = crypto.randomUUID();
    const toast: Toast = { id, type, title, message, duration };
    this.toasts.update(list => [...list, toast]);

    setTimeout(() => this.dismiss(id), duration);
  }

  success(title: string, message?: string): void { this.show('success', title, message); }
  error(title: string, message?: string): void   { this.show('error',   title, message, 6000); }
  warning(title: string, message?: string): void { this.show('warning', title, message); }
  info(title: string, message?: string): void    { this.show('info',    title, message); }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
