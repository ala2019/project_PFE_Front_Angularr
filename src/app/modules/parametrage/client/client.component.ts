// fichier: src/app/client/client.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FournisseurClientService } from 'src/app/core/services/fourisseur-client.service';
import { ModalComponent } from "../../../shared/modal.component";

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './client.component.html'
})
export class ClientComponent implements OnInit {

    isModalOpen = false;  // par défaut modal fermé

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }
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
  }

  delete(id: number): void {
    this.service.delete(id.toString()).subscribe(() => this.getClients());
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

  private afterSave(): void {
    this.getClients();
    this.cancel();
  }
}
