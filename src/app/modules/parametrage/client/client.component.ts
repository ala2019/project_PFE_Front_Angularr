// fichier: src/app/client/client.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonneService } from '../../../core/services/personne.service';
import { DeviseService } from '../../../core/services/devise.service';
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
  devises: any[] = [];
  formData: any = this.resetForm();
  isEditing = false;

  // Filtres
  filters = {
    codeClient: '',
    nom: ''
  };
  filteredClients: any[] = [];

  constructor(
    private service: PersonneService,
    private deviseService: DeviseService
  ) {}

  ngOnInit(): void {
    this.getClients();
    this.getDevises();
  }

  getClients(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        console.log('Données brutes reçues du backend:', data);
        this.clients = data.filter((p: any) => p.type === 'CLIENT');
        this.filteredClients = [...this.clients];
        console.log('Clients filtrés:', this.clients);
        if (this.clients.length > 0) {
          console.log('Premier client:', this.clients[0]);
          console.log('Propriétés du premier client:', Object.keys(this.clients[0]));
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clients:', error);
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
        type: 'CLIENT'
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

  edit(client: any): void {
    // Récupérer le code client de manière robuste
    const codePersonne = client.codePersonne || client.code_personne || '';
    console.log('Code client extrait:', codePersonne);
    
    this.formData = { 
      ...client,
      codePersonne: codePersonne, // S'assurer que codePersonne est défini
      devise: client.devise?.idDevise || client.devise || ''
    };
    
    console.log('FormData final pour édition:', this.formData);
    console.log('formData.codePersonne après assignation:', this.formData.codePersonne);
    
    this.isEditing = true;
    this.createPopUp = true;
  }

  delete(id: number): void {
    console.log('Tentative de suppression du client ID:', id);
    
    this.service.delete(id).subscribe({
      next: (response) => {
        console.log('Client supprimé avec succès, ID:', id, 'Response:', response);
        
        // Mettre à jour les listes locales
        this.clients = this.clients.filter(client => client.idPersonne !== id);
        this.filteredClients = this.filteredClients.filter(client => client.idPersonne !== id);
        
        // Réinitialiser la sélection
        this.selectdID = null;
        this.selectedClient = null;
        
        console.log('Listes mises à jour après suppression');
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du client:', error);
        
        // Si le statut est 200, considérer comme succès malgré l'erreur
        if (error.status === 200) {
          console.log('Suppression réussie (statut 200)');
          
          // Mettre à jour les listes locales
          this.clients = this.clients.filter(client => client.idPersonne !== id);
          this.filteredClients = this.filteredClients.filter(client => client.idPersonne !== id);
          
          // Réinitialiser la sélection
          this.selectdID = null;
          this.selectedClient = null;
        } else {
          alert('Erreur lors de la suppression du client. Veuillez réessayer.');
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
      devise: '',
      type: 'CLIENT'
    };
  }

  cancel(): void {
    this.formData = this.resetForm();
    this.isEditing = false;
  }

  // Modal management methods
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
    this.getClients();
    this.closeModal();
  }

  // Méthode pour obtenir le code client de manière robuste
  getClientCode(client: any): string {
    if (!client) return 'N/A';
    
    if (client.codePersonne) return client.codePersonne;
    if (client.code_personne) return client.code_personne;
    
    return `CLI-${client.idPersonne || 'N/A'}`;
  }

  // Méthodes pour les filtres
  applyFilters(): void {
    this.filteredClients = this.clients.filter(client => {
      const codeMatch = !this.filters.codeClient || 
        this.getClientCode(client).toLowerCase().includes(this.filters.codeClient.toLowerCase());
      
      const nomMatch = !this.filters.nom || 
        client.nomPersonne?.toLowerCase().includes(this.filters.nom.toLowerCase());
      
      return codeMatch && nomMatch;
    });
  }

  clearFilters(): void {
    this.filters = {
      codeClient: '',
      nom: ''
    };
    this.filteredClients = [...this.clients];
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.codeClient || this.filters.nom);
  }

  getFilteredCount(): number {
    return this.filteredClients.length;
  }
}
