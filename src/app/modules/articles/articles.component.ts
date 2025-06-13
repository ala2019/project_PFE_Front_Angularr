// import { HttpClient } from '@angular/common/http';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticleService } from '../../core/services/article.service';
import { CategorieArticleService } from '../parametrage/categoriearticle/categoriearticle.service'; // Assure-toi du bon chemin
import { DomSanitizer } from '@angular/platform-browser';
import { take } from 'rxjs';

declare var $: any;

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.scss'],
})
export class ArticlesComponent implements OnInit, AfterViewInit {
  articles: any[] = [];
  categories: any[] = [];
  articleForm: FormGroup;
  selectedArticle: any = null;
  image: string | ArrayBuffer | null = null;

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
      image: [''],
      status: ['', Validators.required],
      categorie: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.fetchData();
    this.fetchDataCategorie();
  }

  ngAfterViewInit() {
    // $('.modal').modal({ show: false });
  }

  uploadImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Image = (reader.result as string).split(',')[1]; // Enlève le header data:image/...
        this.image = base64Image;
        this.articleForm.patchValue({ image: base64Image });
      };
      reader.readAsDataURL(file);
    }
  }

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
    const articleData = this.articleForm.value;
    if (this.selectedArticle) {
      articleData.idArticle = this.selectedArticle.idArticle;
      this.articleService.updateArticle(this.selectedArticle.idArticle, articleData).subscribe({
        next: () => {
          this.fetchData();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating article', error);
        },
      });
    } else {
      this.articleService.addArticle(articleData).subscribe({
        next: () => {
          this.fetchData();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error adding article', error);
        },
      });
    }
    
  }

  fetchData() {
    this.articleService
      .getArticles()
      .pipe(take(1))
      .subscribe((articles) => {
        this.articles = articles.map((article: any) => ({
          ...article,
          image: article.image ? `data:image/jpeg;base64,${article.image}` : null,
        }));
      });
  }

  fetchDataCategorie() {
    this.categoriearticleService.getcategorie().subscribe((categories) => {
      this.categories = categories;
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
