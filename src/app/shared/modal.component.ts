import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" *ngIf="visible">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">{{ title }}</h3>
          <button (click)="onClose.emit()" class="text-gray-400 hover:text-gray-600">&times;</button>
          <button (click)="onClose.emit()">×</button>

        </div>
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() visible = false;
  @Input() title = '';
  @Output() onClose = new EventEmitter<void>();
}
