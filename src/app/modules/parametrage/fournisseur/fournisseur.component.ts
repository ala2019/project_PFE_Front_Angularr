// fichier: src/app/fournisseur/fournisseur.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FournisseurClientService } from 'src/app/core/services/fourisseur-client.service';
import { ModalComponent } from "../../../shared/modal.component";

@Component({
  selector: 'app-fournisseur',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './fournisseur.component.html'
})
export class FounisseurComponent implements OnInit {

  isModalOpen = false;  // par défaut modal fermé

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }
  fournisseurs: any[] = [];
  formData: any = this.resetForm();
  isEditing = false;

  constructor(private service: FournisseurClientService) {}

  ngOnInit(): void {
    this.getFournisseurs();
  }

  getFournisseurs(): void {
    this.service.getAll().subscribe(data => {
      this.fournisseurs = data.filter((p: any) => p.type === 'FOURNISSEUR');
    });
  }

  save(): void {
    if (this.isEditing) {
      this.service.update(this.formData.idPersonne, this.formData).subscribe(() => this.afterSave());
    } else {
      this.formData.type = 'FOURNISSEUR';
      this.service.create(this.formData).subscribe(() => this.afterSave());
    }
  }

  edit(fournisseur: any): void {
    this.formData = { ...fournisseur };
    this.isEditing = true;
  }

  delete(id: number): void {
    this.service.delete(id.toString()).subscribe(() => this.getFournisseurs());
  }

  resetForm(): any {
    return {
      nompersonne: '',
      telephone: '',
      email: '',
      adresse: '',
      pays: '',
      raison_sociale: '',
      matricule_fiscale: '',
      type: 'FOURNISSEUR'
    };
  }

  cancel(): void {
    this.formData = this.resetForm();
    this.isEditing = false;
  }

  private afterSave(): void {
    this.getFournisseurs();
    this.cancel();
  }
}
