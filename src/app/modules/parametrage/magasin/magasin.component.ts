import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MagasinService } from 'src/app/core/services/magasin.service';
import { PopupComponent } from "../../shared/popup/popup.component";
import { FormsModule } from '@angular/forms';
import { RegionService } from 'src/app/core/services/region.service';


@Component({
  selector: 'app-magasin',
  templateUrl: 'magasin.component.html',
  styleUrl: 'magasin.component.scss',
  imports: [AngularSvgIconModule, CommonModule, PopupComponent, FormsModule],
})
export class MagasinComponent implements OnInit{

  protected magasinList: any[] = [];
  protected regionList : any[] = [];
  protected selectdID!: any;
  regions: any[] = [];


  protected deletedPopUp = false;
  protected createPopUp = false;
  protected updatePopUp = false;

   formData = {
    nomMagasin: '',
    idRegion:  '' ,
    nomregion:''};

  constructor(
    private readonly magasinService: MagasinService,
     private regionService: RegionService) {}

    ngOnInit(): void {
    this.getAll();
    this.loadRegions();

  }

  loadRegions() {
    console.log('Chargement des régions...');
    this.regionService.getAll().subscribe({
      next: (data) => {
        console.log('Régions reçues dans magasin:', data);
        if (Array.isArray(data) && data.length > 0) {
          console.log('Première région:', data[0]);
          console.log('Propriétés de la première région:', Object.keys(data[0]));
        }
        this.regionList = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des régions:', error);
        this.regionList = [];
      }
    });
  }

  getAll() {
    console.log('Chargement des magasins...');
    this.magasinService.getAll().subscribe({
      next: (response: any) => {
        console.log('Magasins reçus:', response);
        if (Array.isArray(response) && response.length > 0) {
          console.log('Premier magasin:', response[0]);
          console.log('Propriétés du premier magasin:', Object.keys(response[0]));
        }
        this.magasinList = response;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des magasins:', error);
        this.magasinList = [];
      }
    });
  }
  delete() {
    this.magasinService.delete(this.selectdID).subscribe({
      next: (response: any) => {
        this.getAll();
      },
      error: () => {
        this.getAll();
      },
    });
    this.selectdID = null;
  }
    onSubmit() {
  if (this.formData.nomMagasin.trim() && this.formData.idRegion) {
    this.magasinService.create(this.formData).subscribe({
      next: (response: any) => {
        this.getAll();
        this.formData = {
          nomMagasin: '',
          idRegion: '',
          nomregion: ''
        };
        this.createPopUp = false;
      },
      error: (err) => {
        console.error("Erreur lors de la création du magasin :", err);
      }
    });
  } else {
    console.warn("Nom du magasin ou région non rempli.");
  }
}

  // Méthode pour obtenir le nom de la région dans le select
  getRegionName(region: any): string {
    return region?.nomregion || region?.nomRegion || region?.name || region?.nom || 'Nom non trouvé';
  }

  // Méthode pour obtenir le nom de la région d'un magasin
  getMagasinRegionName(magasin: any): string {
    if (magasin?.region) {
      return this.getRegionName(magasin.region);
    }
    if (magasin?.idRegion) {
      const region = this.regionList.find(r => r.idRegion === magasin.idRegion);
      return region ? this.getRegionName(region) : 'Région non trouvée';
    }
    return 'Aucune région';
  }

  openUpdatePopup(item: any) {
    this.formData = {
      nomMagasin: item.nomMagasin,
      idRegion: item.idRegion,
      nomregion: ''
    };
    this.updatePopUp = true;
  }

  openUpdatePopupForSelected() {
    const selectedItem = this.magasinList.find(item => item.idMagasin === this.selectdID);
    if (selectedItem) {
      this.openUpdatePopup(selectedItem);
    }
  }

  onSubmitUpdate() {
    if (this.formData.nomMagasin.trim() && this.formData.idRegion) {
      this.magasinService.update(this.formData.idRegion, this.formData).subscribe({
        next: (response: any) => {
          this.getAll();
          this.formData = { nomMagasin: '', idRegion: '', nomregion: '' };
          this.updatePopUp = false;
        },
        error: (err) => {
          console.error('Update error', err);
        }
      });
    }
  }

}
