// fichier: src/app/fournisseur/fournisseur.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonneService } from '../../../core/services/personne.service';
import { DeviseService } from '../../../core/services/devise.service';
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
  devises: any[] = [];
  formData: any = this.resetForm();
  isEditing = false;

  // Filtres
  filters = {
    codeFournisseur: '',
    nom: '',
    email: '',
    devise: ''
  };
  filteredFournisseurs: any[] = [];

  constructor(
    private service: PersonneService,
    private deviseService: DeviseService
  ) {}

  ngOnInit(): void {
    this.getFournisseurs();
    this.getDevises();
  }

  getFournisseurs(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        this.fournisseurs = data.filter((p: any) => p.type === 'FOURNISSEUR');
        this.filteredFournisseurs = [...this.fournisseurs];
      },
      error: (error) => {
        console.error('Erreur lors du chargement des fournisseurs:', error);
      }
    });
  }

  getDevises(): void {
    this.deviseService.getAll().subscribe(data => {
      this.devises = data;
    });
  }

  save(): void {
    if (this.isEditing) {
      if (!this.formData.idPersonne) {
        console.error('ID personne manquant pour la mise à jour');
        alert('Erreur: ID personne manquant');
        return;
      }
      
      this.service.update(this.formData.idPersonne, this.formData).subscribe({
        next: (response) => {
          this.afterSave();
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour:', error);
          alert('Erreur lors de la mise à jour: ' + (error.error?.message || error.message));
        }
      });
    } else {
      const dataToSend = {
        ...this.formData,
        type: 'FOURNISSEUR'
      };
      
      this.service.create(dataToSend).subscribe({
        next: (response) => {
          this.afterSave();
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          alert('Erreur lors de la création: ' + (error.error?.message || error.message));
        }
      });
    }
  }

  edit(fournisseur: any): void {
    // Récupérer le code fournisseur de manière robuste
    const codePersonne = fournisseur.codePersonne || fournisseur.code_personne || '';
    
    this.formData = { 
      ...fournisseur,
      codePersonne: codePersonne,
      devise: fournisseur.devise?.idDevise || fournisseur.devise || ''
    };
    
    this.isEditing = true;
    this.createPopUp = true;
  }

  delete(id: number): void {
    this.service.delete(id).subscribe({
      next: (response) => {
        this.getFournisseurs();
        this.selectdID = null;
        this.selectedFournisseur = null;
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        // Si le statut est 200, considérer comme succès malgré l'erreur
        if (error.status === 200) {
          this.getFournisseurs();
          this.selectdID = null;
          this.selectedFournisseur = null;
        } else {
          alert('Erreur lors de la suppression: ' + error.message);
        }
      }
    });
  }

  resetForm(): any {
    return {
      codePersonne: '',
      nomPersonne: '',
      telephone: '',
      email: '',
      adresse: '',
      ribBancaire: '',
      devise: '',
      type: 'FOURNISSEUR'
    };
  }

  cancel(): void {
    this.formData = this.resetForm();
    this.isEditing = false;
  }

  openModal(): void {
    this.isEditing = false;
    this.formData = this.resetForm();
    this.createPopUp = true;
  }

  closeModal(): void {
    this.createPopUp = false;
    this.cancel();
  }

  private afterSave(): void {
    this.getFournisseurs();
    this.closeModal();
  }

  getFournisseurCode(fournisseur: any): string {
    if (!fournisseur) return 'N/A';
    
    if (fournisseur.codePersonne) return fournisseur.codePersonne;
    if (fournisseur.code_personne) return fournisseur.code_personne;
    
    return `FOUR-${fournisseur.idPersonne || 'N/A'}`;
  }

  // Logique de filtre harmonisée
  applyFilters(): void {
    this.filteredFournisseurs = this.fournisseurs.filter(fournisseur => {
      const codeMatch = !this.filters.codeFournisseur ||
        this.getFournisseurCode(fournisseur).toLowerCase().includes(this.filters.codeFournisseur.toLowerCase());
      const nomMatch = !this.filters.nom ||
        fournisseur.nomPersonne?.toLowerCase().includes(this.filters.nom.toLowerCase());
      const emailMatch = !this.filters.email ||
        fournisseur.email?.toLowerCase().includes(this.filters.email.toLowerCase());
      const deviseMatch = !this.filters.devise ||
        fournisseur.devise?.idDevise == this.filters.devise;
      return codeMatch && nomMatch && emailMatch && deviseMatch;
    });
  }

  clearFilters(): void {
    this.filters = {
      codeFournisseur: '',
      nom: '',
      email: '',
      devise: ''
    };
    this.filteredFournisseurs = [...this.fournisseurs];
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.codeFournisseur || this.filters.nom || this.filters.email || this.filters.devise);
  }

  getFilteredCount(): number {
    return this.filteredFournisseurs.length;
  }
}
