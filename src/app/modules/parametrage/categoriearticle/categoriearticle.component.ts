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
  filteredCategories: any[] = [];
  formData: any = this.resetForm();
  isEditing = false;

  // Filters
  filters = {
    nomCategorie: ''
  };

  constructor(private service: CategorieArticleService) {}

  ngOnInit(): void {
    this.getCategories();
  }

  getCategories(): void {
    this.service.getcategorie().subscribe(data => {
      this.categories = data;
      this.filteredCategories = [...data];
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

  // Filter methods
  hasActiveFilters(): boolean {
    return !!(this.filters.nomCategorie?.trim());
  }

  getFilteredCount(): number {
    return this.filteredCategories.length;
  }

  onFilterChange(): void {
    // Cette méthode peut être appelée pour des actions en temps réel si nécessaire
  }

  applyFilters(): void {
    this.filteredCategories = this.categories.filter((categorie) => {
      // Filtre par nom de catégorie
      if (this.filters.nomCategorie && this.filters.nomCategorie.trim()) {
        const searchTerm = this.filters.nomCategorie.toLowerCase().trim();
        return categorie.nomCategorie && categorie.nomCategorie.toLowerCase().includes(searchTerm);
      }
      return true;
    });
  }

  clearFilters(): void {
    this.filters = {
      nomCategorie: ''
    };
    this.filteredCategories = [...this.categories];
  }
}
