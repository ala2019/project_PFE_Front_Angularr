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
  protected regionList: any[] = [];
  protected selectdID!: any;
  protected deletedPopUp = false;
  protected createPopUp = false;
  protected updatePopUp = false;

  formData = {
    nomregion: '',
    codeRegion: '',
    idRegion: null, // Ajout de l'ID pour la mise à jour
  };
  

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
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des régions:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        this.regionList = [];
      },
    });
  }

  delete() {
    this.regionService.delete(this.selectdID).subscribe({
      next: (response: any) => {
        this.getAll();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.getAll();
      },
    });
    this.selectdID = null;
  }

  onSubmit() {
    if (this.formData.nomregion.trim() && this.formData.codeRegion.trim()) {
      this.regionService.create(this.formData).subscribe({
        next: (response: any) => {
          console.log('Région créée:', response);
          this.getAll();
          this.formData = {
            idRegion: null,
            nomregion: '',
            codeRegion: '',
          };
          this.createPopUp = false;
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
        },
      });
    }
  }

  openUpdatePopup(item: any) {
    this.formData = {
      idRegion: item.idRegion,
      nomregion: item.nomregion,
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
    if (this.formData.nomregion.trim() && this.formData.codeRegion.trim() && this.formData.idRegion !== null) {
      this.regionService.update(this.formData.idRegion, this.formData).subscribe({
        next: (response: any) => {
          this.getAll();
          this.formData = { nomregion: '', idRegion: null, codeRegion: '' };
          this.updatePopUp = false;
        },
        error: (err) => {
          console.error('Update error', err);
        }
      });
    }
  }

  getRegionName(item: any): string {
    // Débogage: afficher toutes les propriétés disponibles
    console.log('Structure de l\'objet région:', item);
    return item?.nomregion || item?.nomRegion || item?.name || item?.nom || 'Nom non trouvé';
  }

}
