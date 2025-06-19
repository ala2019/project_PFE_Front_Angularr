// fichier: src/app/client/client.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FournisseurClientService } from 'src/app/core/services/fourisseur-client.service';
import { PopupComponent } from '../../shared/popup/popup.component';


@Component({
  selector: 'app-client',
  standalone: true,
  templateUrl: './client.component.html',
  styleUrl: './client.component.scss',
  imports: [CommonModule, FormsModule, PopupComponent],
})
export class ClientComponent implements OnInit {

  // Popup management
  createPopUp = false;
  deletedPopUp = false;
  
  // Selection tracking
  selectdID: number | null = null;
  selectedClient: any = null;

  clients: any[] = [];
  formData: any = this.resetForm();
  isEditing = false;

  constructor(private service: FournisseurClientService) {}

  ngOnInit(): void {
    this.getClients();
  }

  getClients(): void {
    this.service.getAll().subscribe(data => {
      this.clients = data.filter((p: any) => p.type === 'CLIENT');
    });
  }

  save(): void {
    if (this.isEditing) {
      this.service.update(this.formData.idPersonne, this.formData).subscribe(() => this.afterSave());
    } else {
      this.formData.type = 'CLIENT';
      this.service.create(this.formData).subscribe(() => this.afterSave());
    }
  }

  edit(client: any): void {
    this.formData = { ...client };
    this.isEditing = true;
    this.createPopUp = true;
  }

  delete(id: number): void {
    this.service.delete(id.toString()).subscribe(() => {
      this.getClients();
      this.selectdID = null;
      this.selectedClient = null;
    });
  }

  resetForm(): any {
    return {
      nompersonne: '',
      telephone: '',
      email: '',
      adresse: '',
      pays: '',
      type: 'CLIENT'
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
    this.getClients();
    this.closeModal();
  }
}
