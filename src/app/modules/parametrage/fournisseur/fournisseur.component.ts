// fichier: src/app/fournisseur/fournisseur.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FournisseurClientService } from 'src/app/core/services/fourisseur-client.service';
import { PopupComponent } from '../../shared/popup/popup.component';

@Component({
  selector: 'app-fournisseur',
  standalone: true,
  templateUrl: './fournisseur.component.html',
  styleUrl: './fournisseur.component.scss',
  imports: [CommonModule, FormsModule, PopupComponent],
})
export class FounisseurComponent implements OnInit {

  // Popup management
  createPopUp = false;
  deletedPopUp = false;
  
  // Selection tracking
  selectdID: number | null = null;
  selectedFournisseur: any = null;

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
    this.createPopUp = true;
  }

  delete(id: number): void {
    this.service.delete(id.toString()).subscribe(() => {
      this.getFournisseurs();
      this.selectdID = null;
      this.selectedFournisseur = null;
    });
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
    this.getFournisseurs();
    this.closeModal();
  }
}
