// import { HttpClient } from '@angular/common/http';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ArticleService } from '../../core/services/article.service';
import { CategorieArticleService } from '../../core/services/categorie.service'; // Fixed import path
import { DomSanitizer } from '@angular/platform-browser';
import { take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PopupComponent } from '../shared/popup/popup.component';
import { FormsModule } from '@angular/forms';

declare var $: any;

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.scss'],
  imports: [CommonModule, PopupComponent, FormsModule, ReactiveFormsModule],
  standalone: true
})
export class ArticlesComponent implements OnInit, AfterViewInit {
  articles: any[] = [];
  categories: any[] = [];
  articleForm: FormGroup;
  selectedArticle: any = null;
  image: string | ArrayBuffer | null = null;
  selectdID: any = null;
  deletedPopUp = false;
  createPopUp = false;

  // Variables pour la pagination
  currentPage = 1;
  itemsPerPage = 5;
  totalItems = 0;
  paginatedArticles: any[] = [];

  // Variables pour les filtres
  filters = {
    code: '',
    reference: '',
    description: '',
    categorie: ''
  };

  // Articles filtrés
  filteredArticles: any[] = [];

  formData = {
    reference: '',
    description: '',
    prix: '',
    tva: '',
    stockMin: '',
    code: '',
    categorie: ''
  };

  constructor(
    private fb: FormBuilder,
    private articleService: ArticleService,
    private categoriearticleService: CategorieArticleService,
    private sanitizer: DomSanitizer,
  ) {
    this.articleForm = this.fb.group({
      reference: ['', Validators.required],
      description: ['', Validators.required],
      prix: ['', Validators.required],
      tva: ['', Validators.required],
      stockMin: ['', Validators.required],
      code: ['', Validators.required],
      categorie: ['', Validators.required],
    });
  }

  ngOnInit() {
    console.log('Initialisation du composant articles...');
    // Charger d'abord les catégories, puis les articles
    this.fetchDataCategorie();
    // Charger les articles après un délai pour s'assurer que les catégories sont chargées
    setTimeout(() => {
      this.fetchData();
    }, 1000);
  }

  ngAfterViewInit() {
    // $('.modal').modal({ show: false });
  }

  // uploadImage(event: any) {
  //   const file = event.target.files[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = () => {
  //       const base64Image = (reader.result as string).split(',')[1]; // Enlève le header data:image/...
  //       this.image = base64Image;
  //       this.articleForm.patchValue({ image: base64Image });
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // }

  openModal(article: any) {
    this.selectedArticle = article ? { ...article } : null;
    if (this.selectedArticle) {
      this.articleForm.patchValue(this.selectedArticle);
    } else {
      this.articleForm.reset();
    }
    $('#exampleModal').modal('show');
  }

  closeModal() {
    this.selectedArticle = null;
    $('#exampleModal').modal('hide');
  }

  onSubmit() {
    console.log('Soumission du formulaire...');
    
    // Marquer tous les champs comme touchés pour déclencher la validation
    Object.keys(this.articleForm.controls).forEach(key => {
      const control = this.articleForm.get(key);
      control?.markAsTouched();
    });
    
    console.log('FormGroup valide:', this.articleForm.valid);
    console.log('FormGroup valeurs:', this.articleForm.value);
    console.log('FormGroup erreurs:', this.articleForm.errors);
    
    // Vérifier si le formulaire est valide
    if (this.articleForm.invalid) {
      console.error('Formulaire invalide, soumission annulée');
      console.error('Erreurs du formulaire:', this.articleForm.errors);
      
      // Afficher les erreurs de chaque champ
      Object.keys(this.articleForm.controls).forEach(key => {
        const control = this.articleForm.get(key);
        if (control?.invalid) {
          console.error(`Erreur dans ${key}:`, control.errors);
        }
      });
      
      alert('Veuillez corriger les erreurs dans le formulaire avant de soumettre.');
      return;
    }
    
    // Vérification supplémentaire des champs requis
    const requiredFields = ['code', 'reference', 'description', 'prix', 'tva', 'stockMin', 'categorie'];
    console.log('=== VÉRIFICATION DES CHAMPS REQUIS ===');
    console.log('FormGroup complet:', this.articleForm.value);
    
    const missingFields = requiredFields.filter(field => {
      const control = this.articleForm.get(field);
      const value = control?.value;
      const isValid = !value || value === '' || value === null || value === undefined;
      console.log(`Champ ${field}:`, value, 'Type:', typeof value, 'Manquant:', isValid);
      return isValid;
    });
    
    if (missingFields.length > 0) {
      console.error('Champs manquants:', missingFields);
      console.error('Valeurs du FormGroup:', this.articleForm.value);
      alert(`Veuillez remplir tous les champs requis: ${missingFields.join(', ')}`);
      return;
    }
    
    console.log('Tous les champs requis sont remplis ✓');
    
    // Synchroniser formData avec les valeurs du FormGroup
    this.formData = this.articleForm.value;
    console.log('FormData après synchronisation:', this.formData);
    
    // Préparer les données pour l'API - structure simplifiée
    const articleData: any = {
      code: this.articleForm.get('code')?.value,
      reference: this.articleForm.get('reference')?.value,
      description: this.articleForm.get('description')?.value,
      prix: parseFloat(this.articleForm.get('prix')?.value) || null,
      tva: parseFloat(this.articleForm.get('tva')?.value) || null,
      stockMin: parseInt(this.articleForm.get('stockMin')?.value) || null
    };
    
    // Gestion spéciale pour la catégorie
    const categorieValue = this.articleForm.get('categorie')?.value;
    if (categorieValue) {
      console.log('Gestion de la catégorie - ID original:', categorieValue, 'Type:', typeof categorieValue);
      
      // Essayer de trouver l'objet catégorie complet
      const selectedCategorie = this.categories.find(cat => cat.idCategorie == categorieValue);
      if (selectedCategorie) {
        console.log('Objet catégorie trouvé:', selectedCategorie);
        articleData.categorie = selectedCategorie;
      } else {
        // Si l'objet n'est pas trouvé, essayer avec juste l'ID
        const categorieId = parseInt(categorieValue);
        if (!isNaN(categorieId)) {
          console.log('Conversion en ID numérique:', categorieId);
          articleData.categorie = categorieId;
        } else {
          console.log('Utilisation de l\'ID tel quel:', categorieValue);
          articleData.categorie = categorieValue;
        }
      }
    }
    
    // Nettoyer les valeurs null
    Object.keys(articleData).forEach(key => {
      if (articleData[key] === null || articleData[key] === undefined || articleData[key] === '') {
        delete articleData[key];
      }
    });
    
    console.log('=== DONNÉES FINALES À ENVOYER ===');
    console.log('ArticleData:', articleData);
    console.log('Type de categorie:', typeof articleData.categorie);
    console.log('JSON stringifié:', JSON.stringify(articleData, null, 2));
    console.log('Headers Content-Type:', 'application/json');
    
    if (this.selectdID) {
      // Mode édition
      console.log('=== MODE ÉDITION ===');
      console.log('ID sélectionné:', this.selectdID);
      articleData.idArticle = this.selectdID;
      
      this.articleService.updateArticle(this.selectdID, articleData).subscribe({
        next: (response) => {
          console.log('Article mis à jour avec succès:', response);
          this.fetchData();
          this.createPopUp = false;
          this.selectdID = null;
          this.resetForm();
          this.showNotification('bottom', 'right');
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de l\'article:', error);
          console.error('Status:', error.status);
          console.error('StatusText:', error.statusText);
          console.error('Message:', error.message);
          console.error('Error body:', error.error);
          console.error('Error text:', error.error?.text || 'Pas de texte d\'erreur');
          console.error('Error details:', error.error?.details || 'Pas de détails');
          console.error('URL:', error.url);
          
          let errorMessage = 'Erreur lors de la mise à jour de l\'article';
          
          if (error.status === 500) {
            errorMessage = 'Erreur serveur (500) - Impossible de mettre à jour l\'article.';
            if (error.error && error.error.message) {
              errorMessage += '\nDétails: ' + error.error.message;
            }
          } else if (error.error && error.error.message) {
            errorMessage += ': ' + error.error.message;
          } else if (error.message) {
            errorMessage += ': ' + error.message;
          }
          
          alert(errorMessage);
        },
      });
    } else {
      // Mode création
      console.log('=== MODE CRÉATION ===');
      console.log('Aucun ID sélectionné, création d\'un nouvel article');
      
      this.articleService.addArticle(articleData).subscribe({
        next: (response) => {
          console.log('Article créé avec succès:', response);
          this.fetchData();
          this.createPopUp = false;
          this.resetForm();
          this.showNotification('bottom', 'right');
        },
        error: (error) => {
          console.error('Erreur lors de la création de l\'article:', error);
          console.error('Status:', error.status);
          console.error('StatusText:', error.statusText);
          console.error('Message:', error.message);
          console.error('Error body:', error.error);
          console.error('Error text:', error.error?.text || 'Pas de texte d\'erreur');
          console.error('Error details:', error.error?.details || 'Pas de détails');
          console.error('URL:', error.url);
          
          let errorMessage = 'Erreur lors de la création de l\'article';
          
          if (error.status === 500) {
            errorMessage = 'Erreur serveur (500) - Impossible de créer l\'article.';
            if (error.error && error.error.message) {
              errorMessage += '\nDétails: ' + error.error.message;
            }
          } else if (error.error && error.error.message) {
            errorMessage += ': ' + error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage += ': ' + error.error;
          } else if (error.message) {
            errorMessage += ': ' + error.message;
          }
          
          alert(errorMessage);
        },
      });
    }
  }

  resetForm() {
    this.formData = {
      reference: '',
      description: '',
      prix: '',
      tva: '',
      stockMin: '',
      code: '',
      categorie: ''
    };
    
    // Réinitialiser aussi le FormGroup
    this.articleForm.reset();
  }

  editArticle() {
    if (this.selectdID) {
      const selectedArticle = this.articles.find(article => article.idArticle === this.selectdID);
      if (selectedArticle) {
        console.log('Article sélectionné pour édition:', selectedArticle);
        console.log('Catégorie de l\'article sélectionné:', selectedArticle.categorie);
        
        this.formData = {
          reference: selectedArticle.reference || '',
          description: selectedArticle.description || '',
          prix: selectedArticle.prix || '',
          tva: selectedArticle.tva || '',
          stockMin: selectedArticle.stockMin || '',
          code: selectedArticle.code || '',
          categorie: selectedArticle.categorie?.idCategorie || selectedArticle.idCategorie || ''
        };
        
        // Synchroniser le FormGroup avec formData
        this.articleForm.patchValue(this.formData);
        
        console.log('FormData pour édition:', this.formData);
        console.log('FormGroup après patchValue:', this.articleForm.value);
        
        // S'assurer que les catégories sont chargées
        if (this.categories.length === 0) {
          console.log('Aucune catégorie trouvée pour édition, rechargement...');
          this.fetchDataCategorie();
          setTimeout(() => {
            this.createPopUp = true;
            console.log('Catégories après rechargement pour édition:', this.categories);
          }, 500);
        } else {
          this.createPopUp = true;
        }
      }
    }
  }

  getCategorieName(article: any): string {
    console.log('Article complet:', article);
    console.log('Catégorie de l\'article:', article.categorie);
    
    if (article.categorie?.nomCategorie) return article.categorie.nomCategorie;
    if (typeof article.categorie === 'string') return article.categorie;
    return 'N/A';
  }

  fetchData() {
    this.articleService
      .getArticles()
      .pipe(take(1))
      .subscribe((articles) => {
        console.log('Articles reçus:', articles); // Debug
        this.articles = articles.map((article: any) => {
          // Traitement de l'image
          const processedArticle = {
            ...article,
            image: article.image ? `data:image/jpeg;base64,${article.image}` : null,
          };
          
          // Debug de la catégorie
          console.log('Article ID:', article.idArticle, 'Catégorie:', article.categorie);
          
          return processedArticle;
        });
        console.log('Articles traités:', this.articles); // Debug
        
        // Mapper les catégories si nécessaire
        this.mapCategoriesToArticles();
        this.updateFilteredArticles();
        this.updatePagination();
      });
  }

  mapCategoriesToArticles() {
    if (this.categories.length > 0) {
      this.articles = this.articles.map(article => {
        // Si l'article a un ID de catégorie mais pas l'objet catégorie complet
        if (article.idCategorie && !article.categorie) {
          const categorie = this.categories.find(cat => cat.idCategorie === article.idCategorie);
          if (categorie) {
            article.categorie = categorie;
          }
        }
        return article;
      });
      console.log('Articles après mapping des catégories:', this.articles);
      this.updatePagination();
    }
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedArticles = this.articles.slice(startIndex, endIndex);
  }

  getPaginatedArticles(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredArticles.slice(startIndex, endIndex);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Propriété pour accéder à Math dans le template
  Math = Math;

  // Méthode pour ouvrir la popup de création
  openCreatePopup() {
    console.log('=== OUVERTURE POPUP DE CRÉATION ===');
    console.log('selectdID avant réinitialisation:', this.selectdID);
    
    // Réinitialiser l'ID sélectionné pour s'assurer qu'on est en mode création
    this.selectdID = null;
    
    // Réinitialiser le formulaire
    this.resetForm();
    
    console.log('FormData après reset:', this.formData);
    console.log('FormGroup après reset:', this.articleForm.value);
    console.log('FormGroup valide:', this.articleForm.valid);
    
    // Toujours recharger les catégories pour s'assurer qu'elles sont à jour
    console.log('Rechargement forcé des catégories...');
    this.fetchDataCategorie();
    
    // Attendre que les catégories soient chargées
    setTimeout(() => {
      console.log('Catégories après rechargement:', this.categories);
      console.log('Longueur après rechargement:', this.categories.length);
      
      // Ouvrir la popup
      this.createPopUp = true;
      
      // Vérifier à nouveau après ouverture de la popup
      setTimeout(() => {
        console.log('=== ÉTAT FINAL AVANT SOUMISSION ===');
        console.log('selectdID:', this.selectdID);
        console.log('createPopUp:', this.createPopUp);
        console.log('FormData:', this.formData);
        console.log('FormGroup:', this.articleForm.value);
        console.log('FormGroup valide:', this.articleForm.valid);
        console.log('Catégories disponibles:', this.categories.length);
      }, 100);
    }, 1000);
  }

  // Méthode pour obtenir le nom de catégorie de manière robuste
  getCategorieDisplayName(categorie: any): string {
    if (!categorie) return 'N/A';
    
    // Essayer différentes propriétés possibles
    if (categorie.nomCategorie) return categorie.nomCategorie;
    if (categorie.nom) return categorie.nom;
    if (categorie.name) return categorie.name;
    if (categorie.libelle) return categorie.libelle;
    if (categorie.libelleCategorie) return categorie.libelleCategorie;
    
    // Si aucune propriété trouvée, retourner l'ID
    return `Catégorie ${categorie.idCategorie || 'Inconnue'}`;
  }

  fetchDataCategorie() {
    console.log('Chargement des catégories...');
    console.log('URL de l\'API:', 'http://localhost:8081/api/categorie/all');
    
    this.categoriearticleService.getcategorie().subscribe({
      next: (categories) => {
        console.log('Réponse brute de l\'API catégories:', categories);
        this.categories = categories;
        console.log('Catégories chargées avec succès:', this.categories);
        console.log('Nombre de catégories:', this.categories.length);
        
        if (this.categories.length > 0) {
          console.log('Première catégorie:', this.categories[0]);
          console.log('Propriétés de la première catégorie:', Object.keys(this.categories[0] || {}));
        } else {
          console.warn('Aucune catégorie reçue de l\'API');
        }
        
        // Si les articles sont déjà chargés, mapper les catégories
        if (this.articles.length > 0) {
          this.mapCategoriesToArticles();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
        console.error('Status de l\'erreur:', error.status);
        console.error('StatusText:', error.statusText);
        console.error('Message d\'erreur:', error.message);
      }
    });
  }

  deleteArticles(id: any) {
    console.log('Suppression de l\'article avec ID:', id);
    
    // Vérifier que l'ID est valide
    if (!id || id === null || id === undefined) {
      console.error('ID d\'article invalide:', id);
      alert('ID d\'article invalide. Impossible de supprimer.');
      return;
    }
    
    // Vérifier que l'article existe dans la liste
    const articleToDelete = this.articles.find(article => article.idArticle === id);
    if (!articleToDelete) {
      console.error('Article non trouvé avec l\'ID:', id);
      alert('Article non trouvé. Impossible de supprimer.');
      return;
    }
    
    console.log('Article à supprimer:', articleToDelete);
    
    this.articleService.deleteArticle(id).subscribe({
      next: (response) => {
        console.log('Article supprimé avec succès:', response);
        this.fetchData();
        this.selectdID = null; // Réinitialiser la sélection
        this.showNotification('bottom', 'right', 'Article supprimé avec succès.');
      },
      error: (error) => {
        console.error('Erreur lors de la suppression de l\'article:', error);
        console.error('Status:', error.status);
        console.error('StatusText:', error.statusText);
        console.error('Message:', error.message);
        console.error('Error body:', error.error);
        console.error('Error text:', error.error?.text || 'Pas de texte d\'erreur');
        console.error('Error details:', error.error?.details || 'Pas de détails');
        console.error('URL:', error.url);
        
        let errorMessage = 'Erreur lors de la suppression de l\'article';
        
        if (error.status === 500) {
          errorMessage = 'Erreur serveur (500) - Impossible de supprimer l\'article.';
          if (error.error && error.error.message) {
            errorMessage += '\nDétails: ' + error.error.message;
          }
        } else if (error.error && error.error.message) {
          errorMessage += ': ' + error.error.message;
        } else if (error.error && typeof error.error === 'string') {
          errorMessage += ': ' + error.error;
        } else if (error.message) {
          errorMessage += ': ' + error.message;
        }
        
        alert(errorMessage);
      }
    });
  }

  showNotification(from: string, align: string, message: string = 'Opération terminée avec succès.') {
    $.notify(
      {
        icon: 'notifications',
        message: message,
      },
      {
        type: 'success',
        timer: 3000,
        placement: { from, align },
      },
    );
  }

  // Méthodes pour les filtres
  applyFilters() {
    this.currentPage = 1;
    this.updateFilteredArticles();
    this.updatePagination();
  }

  clearFilters() {
    this.filters = {
      code: '',
      reference: '',
      description: '',
      categorie: ''
    };
    this.currentPage = 1;
    this.updateFilteredArticles();
    this.updatePagination();
  }

  updateFilteredArticles() {
    this.filteredArticles = this.articles.filter(article => {
      const codeMatch = !this.filters.code || 
        article.code?.toLowerCase().includes(this.filters.code.toLowerCase());
      
      const referenceMatch = !this.filters.reference || 
        article.reference?.toLowerCase().includes(this.filters.reference.toLowerCase());
      
      const descriptionMatch = !this.filters.description || 
        article.description?.toLowerCase().includes(this.filters.description.toLowerCase());
      
      const categorieMatch = !this.filters.categorie || 
        this.getCategorieName(article)?.toLowerCase().includes(this.filters.categorie.toLowerCase());
      
      return codeMatch && referenceMatch && descriptionMatch && categorieMatch;
    });
    
    this.totalItems = this.filteredArticles.length;
  }
}
