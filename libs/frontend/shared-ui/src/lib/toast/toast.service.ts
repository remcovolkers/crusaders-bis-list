import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  dismissing?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = computed(() => this._toasts());

  show(message: string, type: ToastType = 'success', duration = 3500): void {
    const id = ++this.nextId;
    this._toasts.update((list) => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.map((t) => (t.id === id ? { ...t, dismissing: true } : t)));
    setTimeout(() => this._toasts.update((list) => list.filter((t) => t.id !== id)), 250);
  }
}
