import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupComponent } from '../../shared/popup/popup.component';

@Component({
  selector: 'app-extra',
  templateUrl: 'extra.component.html',
  styleUrl: 'extra.component.scss',
  imports: [CommonModule, FormsModule, PopupComponent],
})
export class ExtraComponent implements OnInit {

  // Popup management
  createPopUp = false;
  deletedPopUp = false;
  
  // Selection tracking
  selectdID: number | null = null;
  selectedExtra: any = null;

  extras: any[] = [];
  formData: any = this.resetForm();
  isEditing = false;

  constructor() {}

  ngOnInit(): void {
    this.getExtras();
  }

  getExtras(): void {
    // Mock data - replace with actual service call
    this.extras = [
      { idExtra: 1, nomExtra: 'Frais de livraison', montant: 10.50, description: 'Frais de livraison standard' },
      { idExtra: 2, nomExtra: 'Assurance', montant: 5.00, description: 'Assurance supplémentaire' },
      { idExtra: 3, nomExtra: 'Emballage spécial', montant: 3.50, description: 'Emballage de protection' }
    ];
  }

  save(): void {
    if (this.isEditing) {
      // Update existing extra
      const index = this.extras.findIndex(e => e.idExtra === this.formData.idExtra);
      if (index !== -1) {
        this.extras[index] = { ...this.formData };
      }
      this.afterSave();
    } else {
      // Add new extra
      const newExtra = {
        ...this.formData,
        idExtra: Math.max(...this.extras.map(e => e.idExtra), 0) + 1
      };
      this.extras.push(newExtra);
      this.afterSave();
    }
  }

  edit(extra: any): void {
    this.formData = { ...extra };
    this.isEditing = true;
    this.createPopUp = true;
  }

  delete(id: number): void {
    this.extras = this.extras.filter(e => e.idExtra !== id);
    this.selectdID = null;
    this.selectedExtra = null;
  }

  resetForm(): any {
    return {
      nomExtra: ''
    };
  }

  cancel(): void {
    this.formData = this.resetForm();
    this.isEditing = false;
  }

  // Modal management methods
  openModal(): void {
    this.createPopUp = true;
    this.isEditing = false;
    this.formData = this.resetForm();
  }

  closeModal(): void {
    this.createPopUp = false;
    this.cancel();
  }

  private afterSave(): void {
    this.closeModal();
  }
}
