// import { HttpClient } from '@angular/common/http';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  imports: [CommonModule, PopupComponent, FormsModule],
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
  itemsPerPage = 10;
  totalItems = 0;
  paginatedArticles: any[] = [];

  formData = {
    reference: '',
    description: '',
    prixAchat: '',
    prixVente: '',
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
      prixAchat: ['', Validators.required],
      prixVente: ['', Validators.required],
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
    if (this.selectdID) {
      // Mode édition
      const articleData = { ...this.formData, idArticle: this.selectdID };
      this.articleService.updateArticle(this.selectdID, articleData).subscribe({
        next: () => {
          this.fetchData();
          this.createPopUp = false;
          this.selectdID = null;
          this.resetForm();
        },
        error: (error) => {
          console.error('Error updating article', error);
        },
      });
    } else {
      // Mode création
      this.articleService.addArticle(this.formData).subscribe({
        next: () => {
          this.fetchData();
          this.createPopUp = false;
          this.resetForm();
        },
        error: (error) => {
          console.error('Error adding article', error);
        },
      });
    }
  }

  resetForm() {
    this.formData = {
      reference: '',
      description: '',
      prixAchat: '',
      prixVente: '',
      stockMin: '',
      code: '',
      categorie: ''
    };
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
          prixAchat: selectedArticle.prixAchat || '',
          prixVente: selectedArticle.prixVente || '',
          stockMin: selectedArticle.stockMin || '',
          code: selectedArticle.code || '',
          categorie: selectedArticle.categorie?.idCategorie || selectedArticle.idCategorie || ''
        };
        
        console.log('FormData pour édition:', this.formData);
        
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
        // Mettre à jour la pagination
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
    this.totalItems = this.articles.length;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedArticles = this.articles.slice(startIndex, endIndex);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePagination();
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
    console.log('Ouverture popup de création');
    console.log('Catégories disponibles avant ouverture:', this.categories);
    console.log('Longueur du tableau catégories:', this.categories.length);
    
    // Toujours recharger les catégories pour s'assurer qu'elles sont à jour
    console.log('Rechargement forcé des catégories...');
    this.fetchDataCategorie();
    
    // Attendre que les catégories soient chargées
    setTimeout(() => {
      console.log('Catégories après rechargement:', this.categories);
      console.log('Longueur après rechargement:', this.categories.length);
      this.createPopUp = true;
      
      // Vérifier à nouveau après ouverture de la popup
      setTimeout(() => {
        console.log('Catégories dans la popup:', this.categories);
      }, 100);
    }, 1000);
    
    console.log('FormData actuel:', this.formData);
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
        console.error('Message d\'erreur:', error.message);
      }
    });
  }

  deleteArticles(id: any) {
    if (!confirm('Delete Article ?')) return;
    this.articleService.deleteArticle(id).subscribe(() => {
      this.fetchData();
      this.showNotification('bottom', 'right');
    });
  }

  showNotification(from: string, align: string) {
    $.notify(
      {
        icon: 'notifications',
        message: 'Opération terminée avec succès.',
      },
      {
        type: 'success',
        timer: 3000,
        placement: { from, align },
      },
    );
  }
}
