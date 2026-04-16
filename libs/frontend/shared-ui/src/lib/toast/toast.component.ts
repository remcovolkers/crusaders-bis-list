import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'lib-toast',
  imports: [NgClass],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  iconFor(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  }
}
