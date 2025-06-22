import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  standalone: true
})
export class StockComponent implements OnInit {

  // User rights and permissions
  userRights = {
    canViewAllMagasins: false,
    allowedMagasins: [1, 2], // IDs des magasins autorisés pour l'utilisateur
    canExport: true,
    canPrint: true
  };

  // Data arrays
  articles: any[] = [];
  magasins: any[] = [];
  devises: any[] = [];
  filteredArticles: any[] = [];

  // Forms
  filterForm!: FormGroup;

  // State management
  selectedMagasin: number | null = null;
  selectedDevise: string = 'EUR';
  searchTerm = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 15;
  totalItems = 0;

  // Math object for template
  Math = Math;

  constructor(private fb: FormBuilder) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadData();
    this.initializeUserRights();
  }

  initForms(): void {
    this.filterForm = this.fb.group({
      magasinId: [null, []],
      devise: ['EUR', []],
      searchTerm: ['', []]
    });
  }

  loadData(): void {
    // Mock data - replace with actual service calls
    this.magasins = [
      { idMagasin: 1, nom: 'Magasin Sousse', code: 'MP' },
      { idMagasin: 2, nom: 'Magasin Secondaire', code: 'MS' },
      { idMagasin: 3, nom: 'Entrepôt Central', code: 'EC' },
      { idMagasin: 4, nom: 'Point de Vente', code: 'PV' },
      { idMagasin: 5, nom: 'Magasin Régional', code: 'MR' }
    ];

    this.devises = [
      { code: 'EUR', nom: 'Euro', symbole: '€', taux: 1.0 },
      { code: 'USD', nom: 'Dollar US', symbole: '$', taux: 1.08 },
      { code: 'GBP', nom: 'Livre Sterling', symbole: '£', taux: 0.86 },
      { code: 'MAD', nom: 'Dirham Marocain', symbole: 'DH', taux: 10.8 }
    ];

    this.articles = [
      {
        idArticle: 1,
        code: 'ART001',
        reference: 'REF001',
        description: 'Ordinateur portable Dell Latitude',
        prixAchat: 850.00,
        stocks: {
          1: { quantite: 25, valeur: 21250.00 },
          2: { quantite: 15, valeur: 12750.00 },
          3: { quantite: 8, valeur: 6800.00 },
          4: { quantite: 12, valeur: 10200.00 },
          5: { quantite: 20, valeur: 17000.00 }
        }
      },
      {
        idArticle: 2,
        code: 'ART002',
        reference: 'REF002',
        description: 'Écran 24" Samsung',
        prixAchat: 180.00,
        stocks: {
          1: { quantite: 40, valeur: 7200.00 },
          2: { quantite: 25, valeur: 4500.00 },
          3: { quantite: 15, valeur: 2700.00 },
          4: { quantite: 30, valeur: 5400.00 },
          5: { quantite: 18, valeur: 3240.00 }
        }
      },
      {
        idArticle: 3,
        code: 'ART003',
        reference: 'REF003',
        description: 'Bureau ergonomique en bois',
        prixAchat: 280.00,
        stocks: {
          1: { quantite: 15, valeur: 4200.00 },
          2: { quantite: 8, valeur: 2240.00 },
          3: { quantite: 12, valeur: 3360.00 },
          4: { quantite: 6, valeur: 1680.00 },
          5: { quantite: 10, valeur: 2800.00 }
        }
      },
      {
        idArticle: 4,
        code: 'ART004',
        reference: 'REF004',
        description: 'Chaise de bureau pivotante',
        prixAchat: 120.00,
        stocks: {
          1: { quantite: 30, valeur: 3600.00 },
          2: { quantite: 20, valeur: 2400.00 },
          3: { quantite: 15, valeur: 1800.00 },
          4: { quantite: 25, valeur: 3000.00 },
          5: { quantite: 12, valeur: 1440.00 }
        }
      }
    ];

    // Initialiser les articles filtrés
    this.filteredArticles = [...this.articles];
    this.totalItems = this.filteredArticles.length;
  }

  initializeUserRights(): void {
    // Simuler les droits utilisateur - à remplacer par la vraie logique d'authentification
    // this.userRights = this.authService.getUserRights();
    
    // Pour l'exemple, on limite l'accès aux magasins 1 et 2
    this.userRights.allowedMagasins = [1, 2];
    this.userRights.canViewAllMagasins = false;
    
    // Sélectionner automatiquement le premier magasin autorisé
    if (this.userRights.allowedMagasins.length > 0) {
      this.selectedMagasin = this.userRights.allowedMagasins[0];
      this.filterForm.patchValue({ magasinId: this.selectedMagasin });
    }
  }

  // Filter methods
  applyFilters(): void {
    this.filteredArticles = this.articles.filter(article => {
      // Filtre par terme de recherche
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        if (!article.code.toLowerCase().includes(searchLower) &&
            !article.reference.toLowerCase().includes(searchLower) &&
            !article.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Filtre par magasin (si sélectionné)
      if (this.selectedMagasin && !article.stocks[this.selectedMagasin]) {
        return false;
      }
      
      return true;
    });
    
    this.totalItems = this.filteredArticles.length;
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterForm.patchValue({
      searchTerm: '',
      devise: 'EUR'
    });
    this.applyFilters();
  }

  // Stock methods
  getStockQuantity(article: any): number {
    if (!this.selectedMagasin) return 0;
    return article.stocks[this.selectedMagasin]?.quantite || 0;
  }

  getStockValue(article: any): number {
    if (!this.selectedMagasin) return 0;
    const stock = article.stocks[this.selectedMagasin];
    if (!stock) return 0;
    
    const devise = this.devises.find(d => d.code === this.selectedDevise);
    return stock.valeur * (devise?.taux || 1.0);
  }

  getTotalStockValue(): number {
    return this.filteredArticles.reduce((total, article) => {
      return total + this.getStockValue(article);
    }, 0);
  }

  getTotalStockQuantity(): number {
    return this.filteredArticles.reduce((total, article) => {
      return total + this.getStockQuantity(article);
    }, 0);
  }

  getStockStatusClass(quantity: number): string {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity <= 5) return 'bg-orange-100 text-orange-800';
    if (quantity <= 15) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  // Magasin methods
  getAvailableMagasins(): any[] {
    if (this.userRights.canViewAllMagasins) {
      return this.magasins;
    }
    return this.magasins.filter(m => this.userRights.allowedMagasins.includes(m.idMagasin));
  }

  getSelectedMagasinName(): string {
    if (!this.selectedMagasin) return '';
    const magasin = this.magasins.find(m => m.idMagasin === this.selectedMagasin);
    return magasin ? magasin.nom : '';
  }

  onMagasinChange(): void {
    this.selectedMagasin = this.filterForm.get('magasinId')?.value;
    this.applyFilters();
  }

  onDeviseChange(): void {
    this.selectedDevise = this.filterForm.get('devise')?.value;
  }

  // Pagination methods
  getPaginatedArticles(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredArticles.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // Export and print methods
  exportStock(): void {
    if (!this.userRights.canExport) {
      alert('Vous n\'avez pas les droits pour exporter les données.');
      return;
    }
    
    // Logique d'export à implémenter
    console.log('Exporting stock data...');
  }

  printStock(): void {
    if (!this.userRights.canPrint) {
      alert('Vous n\'avez pas les droits pour imprimer.');
      return;
    }
    
    // Logique d'impression à implémenter
    console.log('Printing stock report...');
  }
}
