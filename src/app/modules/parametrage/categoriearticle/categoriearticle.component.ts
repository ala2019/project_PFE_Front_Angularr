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

  // Notification management
  notificationMessage: string | null = null;
  notificationType: 'success' | 'error' = 'success';
  
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
    nomCategorie: '',
  };

  constructor(private service: CategorieArticleService) {}

  ngOnInit(): void {
    this.getCategories();
  }

  getCategories(): void {
    this.service.getcategorie().subscribe((data) => {
      this.categories = data;
      this.filteredCategories = [...data];
    });
  }

  save(): void {
    if (this.isEditing) {
      this.service.updateCategorie(this.formData.idCategorie, this.formData).subscribe({
        next: () => {
          this.showNotification('Catégorie modifiée avec succès', 'success');
          this.afterSave();
        },
        error: (error) => {
          this.showNotification('Erreur lors de la modification: ' + (error.error?.message || error.message || 'Erreur inconnue'), 'error');
        }
      });
    } else {
      this.service.addCategorie(this.formData).subscribe({
        next: () => {
          this.showNotification('Catégorie ajoutée avec succès', 'success');
          this.afterSave();
        },
        error: (error) => {
          this.showNotification('Erreur lors de l\'ajout: ' + (error.error?.message || error.message || 'Erreur inconnue'), 'error');
        }
      });
    }
  }

  edit(categorie: any): void {
    this.formData = { ...categorie };
    this.isEditing = true;
    this.createPopUp = true;
  }

  delete(id: number): void {
    console.log('Tentative de suppression de la catégorie ID:', id);

    this.service.deleteCategorie(id).subscribe({
      next: () => {
        console.log('Catégorie supprimée avec succès, ID:', id);

        // Mettre à jour les listes locales
        this.categories = this.categories.filter((cat) => cat.idCategorie !== id);
        this.filteredCategories = this.filteredCategories.filter((cat) => cat.idCategorie !== id);

        // Réinitialiser la sélection
        this.selectdID = null;
        this.selectedCategorie = null;

        this.showNotification('Catégorie supprimée avec succès', 'success');
        console.log('Listes mises à jour après suppression');
      },
      error: (error) => {
        console.log('Suppression impossible : la catégorie contient encore des articles, ID:', id);

        this.showNotification('Suppression impossible : cette catégorie contient des articles.', 'error');
        // Réinitialiser la sélection
        this.selectdID = null;
        this.selectedCategorie = null;
      },
    });
  }

  resetForm(): any {
    return {
      nomCategorie: '',
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
    return !!this.filters.nomCategorie?.trim();
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
      nomCategorie: '',
    };
    this.filteredCategories = [...this.categories];
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
