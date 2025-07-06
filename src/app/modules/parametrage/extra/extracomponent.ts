import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupComponent } from '../../shared/popup/popup.component';
import { ExtraService, Extra } from '../../../core/services/extra.service';

@Component({
  selector: 'app-extra',
  templateUrl: 'extra.component.html',
  styleUrl: 'extra.component.scss',
  imports: [CommonModule, FormsModule, PopupComponent],
})
export class ExtraComponent implements OnInit {
  protected extraList: Extra[] = [];
  protected selectdID!: number;
  protected deletedPopUp = false;
  protected createPopUp = false;
  protected updatePopUp = false;

  formData: Partial<Extra> = {
    libelle: '',
    idExtra: undefined,
  };

  constructor(private readonly extraService: ExtraService) {}

  ngOnInit(): void {
    this.getAll();
  }

  getAll() {
    this.extraService.getAll().subscribe({
      next: (response: Extra[]) => {
        if (Array.isArray(response) && response.length > 0) {
          console.log('Premier extra:', response[0]);
          console.log('Propriétés du premier extra:', Object.keys(response[0]));
        }
        this.extraList = response;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des extras:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        this.extraList = [];
      },
    });
  }

  delete() {
    this.extraService.delete(this.selectdID).subscribe({
      next: (response: void) => {
        this.getAll();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.getAll();
      },
    });
    this.selectdID = 0;
  }

  onSubmit() {
    if (this.formData.libelle?.trim()) {
      const extraData: Extra = {
        idExtra: 0, // Sera ignoré par le backend pour la création
        libelle: this.formData.libelle
      };
      
      this.extraService.create(extraData).subscribe({
        next: (response: Extra) => {
          console.log('Extra créé:', response);
          this.getAll();
          this.formData = {
            idExtra: undefined,
            libelle: '',
          };
          this.createPopUp = false;
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
        },
      });
    }
  }

  openUpdatePopup(item: Extra) {
    this.formData = {
      idExtra: item.idExtra,
      libelle: item.libelle,
    };
    this.updatePopUp = true;
  }

  openUpdatePopupForSelected() {
    const selectedItem = this.extraList.find(item => item.idExtra === this.selectdID);
    if (selectedItem) {
      this.openUpdatePopup(selectedItem);
    }
  }

  onSubmitUpdate() {
    if (this.formData.libelle?.trim() && this.formData.idExtra !== undefined) {
      const extraData: Extra = {
        idExtra: this.formData.idExtra,
        libelle: this.formData.libelle
      };
      
      this.extraService.update(this.formData.idExtra, extraData).subscribe({
        next: (response: Extra) => {
          this.getAll();
          this.formData = { libelle: '', idExtra: undefined };
          this.updatePopUp = false;
        },
        error: (err) => {
          console.error('Update error', err);
        }
      });
    }
  }

  getExtraName(item: Extra): string {
    // Débogage: afficher toutes les propriétés disponibles
    console.log('Structure de l\'objet extra:', item);
    return item?.libelle || 'Nom non trouvé';
  }
}
