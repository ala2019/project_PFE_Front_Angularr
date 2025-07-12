import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { RegionService } from 'src/app/core/services/region.service';
import { PopupComponent } from '../../shared/popup/popup.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-region',
  templateUrl: 'region.component.html',
  styleUrl: 'region.component.scss',
  imports: [AngularSvgIconModule, CommonModule, PopupComponent, FormsModule],
})
export class RegionComponent implements OnInit {
  // Notification management
  notificationMessage: string | null = null;
  notificationType: 'success' | 'error' = 'success';
  
  protected regionList: any[] = [];
  protected selectdID!: any;
  protected deletedPopUp = false;
  protected createPopUp = false;
  protected updatePopUp = false;

  formData = {
    nomRegion: '',
    codeRegion: '',
    idRegion: null, // Ajout de l'ID pour la mise à jour
  };
  
  filters = {
    code: '',
    nom: ''
  };
  filteredRegions: any[] = [];

  constructor(private readonly regionService: RegionService) {}

  ngOnInit(): void {
    this.getAll();
  }

  getAll() {
    this.regionService.getAll().subscribe({
      next: (response: any) => {
        
        if (Array.isArray(response) && response.length > 0) {
          console.log('Première région:', response[0]);
          console.log('Propriétés de la première région:', Object.keys(response[0]));
        }
        this.regionList = response;
        this.filteredRegions = [...this.regionList];
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des régions:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        this.regionList = [];
        this.filteredRegions = [];
      },
    });
  }

  delete() {
    this.regionService.delete(this.selectdID).subscribe({
      next: (response: any) => {
        this.showNotification('Région supprimée avec succès', 'success');
        this.getAll();
        this.selectdID = null;
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.showNotification('Suppression impossible : cette région contient  des magasins.', 'error');
        this.selectdID = null;
      },
    });
  }

  

  onSubmit() {
    if (this.formData.nomRegion.trim() && this.formData.codeRegion.trim()) {
      this.regionService.create(this.formData).subscribe({
        next: (response: any) => {
          console.log('Région créée:', response);
          this.showNotification('Région ajoutée avec succès', 'success');
          this.getAll();
          this.formData = {
            idRegion: null,
            nomRegion: '',
            codeRegion: '',
          };
          this.createPopUp = false;
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.showNotification('Erreur lors de l\'ajout: ' + (error.error?.message || error.message || 'Erreur inconnue'), 'error');
        },
      });
    }
  }

  openUpdatePopup(item: any) {
    this.formData = {
      idRegion: item.idRegion,
      nomRegion: item.nomRegion,
      codeRegion: item.codeRegion,
    };
    this.updatePopUp = true;
  }

  openUpdatePopupForSelected() {
    const selectedItem = this.regionList.find(item => item.idRegion === this.selectdID);
    if (selectedItem) {
      this.openUpdatePopup(selectedItem);
    }
  }

  onSubmitUpdate() {
    if (this.formData.nomRegion.trim() && this.formData.codeRegion.trim() && this.formData.idRegion !== null) {
      this.regionService.update(this.formData.idRegion, this.formData).subscribe({
        next: (response: any) => {
          this.showNotification('Région modifiée avec succès', 'success');
          this.getAll();
          this.formData = { nomRegion: '', idRegion: null, codeRegion: '' };
          this.updatePopUp = false;
        },
        error: (err) => {
          console.error('Update error', err);
          this.showNotification('Erreur lors de la modification: ' + (err.error?.message || err.message || 'Erreur inconnue'), 'error');
        }
      });
    }
  }

  getRegionName(item: any): string {
    // Débogage: afficher toutes les propriétés disponibles
    console.log('Structure de l\'objet région:', item);
    return item?.nomRegion;
  }

  applyFilters(): void {
    this.filteredRegions = this.regionList.filter(region => {
      const codeMatch = !this.filters.code ||
        region.codeRegion?.toLowerCase().includes(this.filters.code.toLowerCase());
      const nomMatch = !this.filters.nom ||
        this.getRegionName(region).toLowerCase().includes(this.filters.nom.toLowerCase());
      return codeMatch && nomMatch;
    });
  }

  clearFilters(): void {
    this.filters = { code: '', nom: '' };
    this.filteredRegions = [...this.regionList];
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.code || this.filters.nom);
  }

  getFilteredCount(): number {
    return this.filteredRegions.length;
  }

  // Méthodes de notification
  showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.notificationMessage = message;
    this.notificationType = type;
    setTimeout(() => {
      this.notificationMessage = null;
    }, 3000);
  }

  closeNotification() {
    this.notificationMessage = null;
  }

}
