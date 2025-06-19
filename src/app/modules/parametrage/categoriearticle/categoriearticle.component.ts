import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorieArticleService } from '../../../core/services/categorie.service';
import { PopupComponent } from '../../shared/popup/popup.component';

@Component({
  selector: 'app-categoriearticle',
  templateUrl: 'categoriearticle.component.html',
  styleUrl: 'categoriearticle.component.scss',
  imports: [CommonModule, FormsModule, PopupComponent],
})
export class CategoriearticleComponent implements OnInit {

  // Popup management
  createPopUp = false;
  deletedPopUp = false;
  
  // Selection tracking
  selectdID: number | null = null;
  selectedCategorie: any = null;

  categories: any[] = [];
  formData: any = this.resetForm();
  isEditing = false;

  constructor(private service: CategorieArticleService) {}

  ngOnInit(): void {
    this.getCategories();
  }

  getCategories(): void {
    this.service.getcategorie().subscribe(data => {
      this.categories = data;
    });
  }

  save(): void {
    if (this.isEditing) {
      this.service.updateCategorie(this.formData.idCategorie, this.formData).subscribe(() => this.afterSave());
    } else {
      this.service.addCategorie(this.formData).subscribe(() => this.afterSave());
    }
  }

  edit(categorie: any): void {
    this.formData = { ...categorie };
    this.isEditing = true;
    this.createPopUp = true;
  }

  delete(id: number): void {
    this.service.deleteCategorie(id).subscribe(() => {
      this.getCategories();
      this.selectdID = null;
      this.selectedCategorie = null;
    });
  }

  resetForm(): any {
    return {
      nomCategorie: ''
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
    this.getCategories();
    this.closeModal();
  }
}
