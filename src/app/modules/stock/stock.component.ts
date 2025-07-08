import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { StockService } from '../../core/services/stock.service';
import { MagasinService } from '../../core/services/magasin.service';
import { DeviseService } from '../../core/services/devise.service';
import { ArticleService } from '../../core/services/article.service';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  standalone: true,
})
export class StockComponent implements OnInit {
  // User rights and permissions
  userRights = {
    canViewAllMagasins: false,
    allowedMagasins: [1, 2], // IDs des magasins autorisés pour l'utilisateur
    canExport: true,
    canPrint: true,
  };

  // Data arrays
  articles: any[] = [];
  allArticles: any[] = []; // Tous les articles sans stock
  stocks: any[] = []; // Données de stock par magasin
  magasins: any[] = [];
  devises: any[] = [];
  filteredArticles: any[] = [];

  // Forms
  filterForm!: FormGroup;

  // Filters object for template binding
  filters = {
    magasin: null as number | null,
    devise: 'EUR',
    searchTerm: '',
  };

  // State management
  selectedMagasin: number | null = null;
  selectedDevise: string = 'EUR';
  searchTerm = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  totalItems = 0;

  // Loading states
  isLoading = false;
  isLoadingMagasins = false;
  isLoadingDevises = false;
  isLoadingArticles = false;

  // Math object for template
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private magasinService: MagasinService,
    private deviseService: DeviseService,
    private articleService: ArticleService,
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadMagasins();
    this.loadDevises();
    this.loadAllArticles();
    this.initializeUserRights();
  }

  initForms(): void {
    this.filterForm = this.fb.group({
      magasinId: [null, []],
      devise: ['EUR', []],
      searchTerm: ['', []],
    });
  }

  loadMagasins(): void {
    this.isLoadingMagasins = true;
    this.magasinService.getAll().subscribe({
      next: (data) => {
        console.log('Magasins reçus:', data);
        this.magasins = data;
        this.isLoadingMagasins = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des magasins:', error);
        this.isLoadingMagasins = false;
      },
    });
  }

  loadDevises(): void {
    this.isLoadingDevises = true;
    this.deviseService.getAll().subscribe({
      next: (data) => {
        console.log('Devises reçues:', data);
        this.devises = data;
        this.isLoadingDevises = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des devises:', error);
        // Fallback aux devises par défaut en cas d'erreur

        this.isLoadingDevises = false;
      },
    });
  }

  loadAllArticles(): void {
    this.isLoadingArticles = true;
    this.articleService.getArticles().subscribe({
      next: (data) => {
        console.log('Articles reçus:', data);
        this.allArticles = data;
        this.isLoadingArticles = false;
        // Si un magasin est déjà sélectionné, charger les stocks
        if (this.selectedMagasin) {
          this.loadStockData();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des articles:', error);
        this.allArticles = [];
        this.isLoadingArticles = false;
      },
    });
  }

  loadStockData(): void {
    if (!this.selectedMagasin) {
      this.articles = [];
      this.filteredArticles = [];
      this.totalItems = 0;
      return;
    }

    this.isLoading = true;
    this.stockService.getStockByMagasin(this.selectedMagasin).subscribe({
      next: (data) => {
        console.log('Stocks reçus pour le magasin', this.selectedMagasin, ':', data);
        this.stocks = data;
        this.combineArticlesWithStocks();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stocks:', error);
        this.stocks = [];
        this.combineArticlesWithStocks();
        this.isLoading = false;
      },
    });
  }

  combineArticlesWithStocks(): void {
    console.log('=== DÉBUT COMBINAISON ARTICLES/STOCKS ===');
    console.log('Articles disponibles:', this.allArticles.length);
    console.log('Stocks disponibles:', this.stocks.length);

    // Afficher quelques exemples d'articles
    console.log(
      "Exemples d'articles:",
      this.allArticles.slice(0, 3).map((a) => ({
        idArticle: a.idArticle,
        code: a.code,
        nom: a.nom,
        reference: a.reference,
        description: a.description
      })),
    );

    // Afficher quelques exemples de stocks
    console.log(
      'Exemples de stocks:',
      this.stocks.slice(0, 3).map((s) => ({
        idStock: s.idStock,
        qteStock: s.qteStock,
        articleId: s.article?.idArticle,
        keys: Object.keys(s),
      })),
    );

    // Combiner les articles avec leurs stocks
    this.articles = this.allArticles.map((article) => {
      const stockData = this.stocks.find((stock) => stock.article?.idArticle === article.idArticle);

      console.log(`Article ${article.code} (ID: ${article.idArticle}):`, {
        stockTrouve: !!stockData,
        stockData: stockData,
        quantite: stockData ? stockData.qteStock : 0,
      });

      return {
        ...article,
        quantite: stockData ? stockData.qteStock : 0,
        stockMin: article.stockMin || 0,
      };
    });

    // Appliquer les filtres après la combinaison
    this.applyFilters();

    // Afficher le résultat final
    console.log(
      'Articles avec quantités (premiers 3):',
      this.articles.slice(0, 3).map((a) => ({
        code: a.code,
        quantite: a.quantite,
      })),
    );
    console.log('=== FIN COMBINAISON ARTICLES/STOCKS ===');
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
      this.filters.magasin = this.selectedMagasin;
      this.filterForm.patchValue({ magasinId: this.selectedMagasin });
      // Les stocks seront chargés après le chargement des articles
    }
  }

  // Filter methods
  applyFilters(): void {
    if (!this.selectedMagasin) {
      this.filteredArticles = [];
      this.totalItems = 0;
      return;
    }

    // Synchroniser searchTerm avec filters.searchTerm
    this.searchTerm = this.filters.searchTerm;

    console.log('Application des filtres:', {
      magasin: this.selectedMagasin,
      searchTerm: this.searchTerm,
      articlesDisponibles: this.articles.length
    });

    // Filtrer localement les articles
    this.filteredArticles = this.articles.filter((article) => {
      // Filtre par terme de recherche
      if (this.searchTerm && this.searchTerm.trim()) {
        const searchLower = this.searchTerm.toLowerCase().trim();
        const codeMatch = article.code?.toLowerCase().includes(searchLower) || false;
        const referenceMatch = article.reference?.toLowerCase().includes(searchLower) || false;
        const descriptionMatch = article.description?.toLowerCase().includes(searchLower) || false;
        const nomMatch = article.nom?.toLowerCase().includes(searchLower) || false;
        
        console.log(`Article ${article.code}:`, {
          code: article.code,
          reference: article.reference,
          description: article.description,
          nom: article.nom,
          searchTerm: searchLower,
          matches: { codeMatch, referenceMatch, descriptionMatch, nomMatch }
        });

        if (!codeMatch && !referenceMatch && !descriptionMatch && !nomMatch) {
          return false;
        }
      }

      return true;
    });

    this.totalItems = this.filteredArticles.length;
    this.currentPage = 1;

    console.log('Filtres appliqués:', {
      magasin: this.selectedMagasin,
      searchTerm: this.searchTerm,
      results: this.filteredArticles.length,
      articlesFiltres: this.filteredArticles.slice(0, 3).map(a => ({
        code: a.code,
        reference: a.reference,
        description: a.description
      }))
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filters.searchTerm = '';
    this.filters.devise = 'EUR';
    this.selectedDevise = 'EUR';
    
    this.filterForm.patchValue({
      searchTerm: '',
      devise: 'EUR',
    });
    
    // Réappliquer les filtres pour afficher tous les articles
    this.applyFilters();
    
    console.log('Filtres effacés, affichage de tous les articles');
  }

  // Stock methods
  getStockByMagasin(article: any): number {
    if (!this.selectedMagasin) return 0;
    return article.quantite || 0;
  }

  getStockValue(article: any): number {
    if (!this.selectedMagasin) return 0;
    const quantite = this.getStockByMagasin(article);
    const prixAchat = article.prix || 0; // Utiliser article.prix au lieu de prixAchat

    const devise = this.devises.find((d) => d.code === this.selectedDevise);
    return quantite * prixAchat * (devise?.taux || 1.0);
  }

  getTotalStockValue(): number {
    const total = this.filteredArticles.reduce((total, article) => {
      return total + this.getStockValue(article);
    }, 0);
  
    return parseFloat(total.toFixed(2));
  }

  toFix(prix: number){
    return parseFloat(prix.toFixed(2));
  }

  getTotalStockQuantity(): number {
    return this.filteredArticles.reduce((total, article) => {
      return total + this.getStockByMagasin(article);
    }, 0);
  }

  getStockStatusClass(quantity: number): string {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity <= 5) return 'bg-orange-100 text-orange-800';
    if (quantity <= 10) return 'bg-yellow-50 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  // Nouvelle méthode pour vérifier si l'article est en rupture de stock
  isStockAlert(article: any): boolean {
    if (!this.selectedMagasin) return false;
    const currentStock = this.getStockByMagasin(article);
    const stockMin = article.stockMin || 0;
    return currentStock <= stockMin;
  }

  // Nouvelle méthode pour obtenir le statut d'alerte de stock
  getStockAlertStatus(article: any): string {
    if (!this.selectedMagasin) return 'normal';
    const currentStock = this.getStockByMagasin(article);
    const stockMin = article.stockMin || 0;

    if (currentStock === 0) return 'rupture';
    if (currentStock <= stockMin) return 'alerte';
    return 'normal';
  }

  // Nouvelle méthode pour obtenir la classe CSS de l'alerte
  getStockAlertClass(article: any): string {
    const status = this.getStockAlertStatus(article);
    switch (status) {
      case 'rupture':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'alerte':
        return 'bg-orange-50 border-l-4 border-orange-500';
      default:
        return '';
    }
  }

  // Nouvelle méthode pour obtenir l'icône d'alerte
  getStockAlertIcon(article: any): string {
    const status = this.getStockAlertStatus(article);
    switch (status) {
      case 'rupture':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'alerte':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      default:
        return '';
    }
  }

  // Nouvelle méthode pour obtenir le message d'alerte
  getStockAlertMessage(article: any): string {
    const status = this.getStockAlertStatus(article);
    const currentStock = this.getStockByMagasin(article);
    const stockMin = article.stockMin || 0;

    switch (status) {
      case 'rupture':
        return `Rupture de stock ! Stock minimum requis: ${stockMin}`;
      case 'alerte':
        return `Stock faible ! Actuel: ${currentStock}, Minimum: ${stockMin}`;
      default:
        return '';
    }
  }

  // Nouvelle méthode pour compter les articles en alerte
  getAlertCount(): number {
    return this.filteredArticles.filter((article) => article.quantite < 1).length;
  }

  // Nouvelle méthode pour compter les articles en stock (quantité > 0)
  getArticlesInStockCount(): number {
    return this.filteredArticles.filter((article) => (article.quantite || 0) > 0).length;
  }

  // Nouvelle méthode pour obtenir les articles en alerte
  getAlertArticles(): any[] {
    return this.filteredArticles.filter((article) => this.isStockAlert(article));
  }

  // Magasin methods
  getAvailableMagasins(): any[] {
    if (this.userRights.canViewAllMagasins) {
      return this.magasins;
    }
    return this.magasins.filter((m) => this.userRights.allowedMagasins.includes(m.idMagasin));
  }

  get getSelectedMagasinName(): string {
    if (!this.selectedMagasin) return '';
    const magasin = this.magasins.find((m) => m.idMagasin == this.selectedMagasin);
    return magasin ? magasin.nom || magasin.nomMagasin : '';
  }

  get getSelectedDeviseName(): string {
    if (!this.filters.devise) return '';
    const devise = this.devises.find((m) => m.idDevise == this.filters.devise);
    return devise ? devise.symbole || devise.symbole : 'TND';
  }

  get getCofDevise(): number {
    if (!this.filters.devise) return 1;
    const devise = this.devises.find((m) => m.idDevise == this.filters.devise);
    return devise?.tauxChange || 1;
  }

  onMagasinChange(): void {
    this.selectedMagasin = this.filters.magasin;

    this.loadStockData();
  }

  onDeviseChange(): void {
    this.selectedDevise = this.filters.devise;
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

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
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
      alert("Vous n'avez pas les droits pour exporter les données.");
      return;
    }

    // Logique d'export à implémenter
    console.log('Exporting stock data...');
  }

  printStock(): void {
    if (!this.userRights.canPrint) {
      alert("Vous n'avez pas les droits pour imprimer.");
      return;
    }

    // Logique d'impression à implémenter
    console.log('Printing stock report...');
  }

  // Vérifier si des filtres sont actifs
  hasActiveFilters(): boolean {
    const hasSearchTerm = Boolean(this.filters.searchTerm && this.filters.searchTerm.trim() !== '');
    const hasCustomDevise = Boolean(this.filters.devise && this.filters.devise !== 'EUR');
    return hasSearchTerm || hasCustomDevise;
  }

  // Obtenir le nombre de résultats filtrés
  getFilteredCount(): number {
    return this.filteredArticles.length;
  }

  // Méthode de test pour la recherche
  testSearch(searchTerm: string): void {
    console.log('=== TEST RECHERCHE ===');
    console.log('Terme de recherche:', searchTerm);
    
    if (!this.articles || this.articles.length === 0) {
      console.log('Aucun article disponible pour la recherche');
      return;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    const results = this.articles.filter(article => {
      const codeMatch = article.code?.toLowerCase().includes(searchLower) || false;
      const referenceMatch = article.reference?.toLowerCase().includes(searchLower) || false;
      const descriptionMatch = article.description?.toLowerCase().includes(searchLower) || false;
      const nomMatch = article.nom?.toLowerCase().includes(searchLower) || false;
      
      return codeMatch || referenceMatch || descriptionMatch || nomMatch;
    });
    
    console.log('Résultats trouvés:', results.length);
    console.log('Premiers résultats:', results.slice(0, 3).map(r => ({
      code: r.code,
      reference: r.reference,
      description: r.description,
      nom: r.nom
    })));
    console.log('=== FIN TEST RECHERCHE ===');
  }

  // Méthode de débogage pour vérifier les données des articles
  debugArticleData(): void {
    console.log('=== DÉBOGAGE DONNÉES ARTICLES ===');
    console.log('Articles totaux:', this.articles.length);
    console.log('Articles filtrés:', this.filteredArticles.length);
    
    if (this.articles.length > 0) {
      const sampleArticle = this.articles[0];
      console.log('Exemple d\'article:', {
        idArticle: sampleArticle.idArticle,
        code: sampleArticle.code,
        reference: sampleArticle.reference,
        description: sampleArticle.description,
        nom: sampleArticle.nom,
        quantite: sampleArticle.quantite,
        stockMin: sampleArticle.stockMin
      });
    }
    
    console.log('Terme de recherche actuel:', this.searchTerm);
    console.log('Magasin sélectionné:', this.selectedMagasin);
    console.log('=== FIN DÉBOGAGE ===');
  }

  // Appliquer les filtres automatiquement quand les valeurs changent
  onFilterChange(): void {
    // Tester la recherche si un terme est fourni
    if (this.filters.searchTerm && this.filters.searchTerm.trim()) {
      this.testSearch(this.filters.searchTerm);
    }
    
    // Appliquer les filtres immédiatement pour une meilleure réactivité
    this.applyFilters();
    // Déboguer les données
    this.debugArticleData();
  }

  // Validation des filtres
  validateFilters(): boolean {
    // Vérifier que le magasin est sélectionné
    if (!this.selectedMagasin) {
      console.warn('Aucun magasin sélectionné');
      return false;
    }
    return true;
  }

  // Appliquer les filtres avec validation
  applyFiltersWithValidation(): void {
    if (!this.validateFilters()) {
      return;
    }
    this.applyFilters();
  }
}
