import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommandeService } from 'src/app/core/services/commande.service';
import { PopupComponent } from '../../shared/popup/popup.component';
import { FournisseurClientService } from 'src/app/core/services/fourisseur-client.service';
import { MagasinService } from 'src/app/core/services/magasin.service';
import { StockService } from 'src/app/core/services/stock.service';
import { FactureService, FactureData } from 'src/app/core/services/facture.service';
import { FACTURE_CONFIG } from 'src/app/core/constants/facture.config';
declare var html2pdf: any;

@Component({
  selector: 'app-cmdvente',
  templateUrl: './cmdvente.component.html',
  styleUrls: ['./cmdvente.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PopupComponent],
  standalone: true,
})
export class CmdventetComponent implements OnInit {
  // Popup management
  createPopUp = false;
  detailsPopUp = false;
  deletedPopUp = false;
  articleSelectionPopUp = false;

  // Selection tracking
  selectdID: number | null = null;
  selectedCommande: any = null;

  // Data arrays
  commandes: any[] = [];
  filteredCommandes: any[] = [];
  allCommandes: any[] = [];
  clients: any[] = [];
  magasins: any[] = [];
  stocksByMagasin: { [key: number]: any[] } = {};
  articles: any[] = [];
  articlesWithStock: any[] = [];
  modesPaiement: any[] = [];

  // Forms
  commandeForm!: FormGroup;
  lineForm!: FormGroup;
  factureForm!: FormGroup;

  // State management
  isEditing = false;
  showLineForm = false;
  currentLineIndex: number | null = null;

  // Filters
  filters = {
    libelle: '',
    client: '',
    magasin: '',
    dateDebut: '',
    dateFin: '',
  };

  // Article search filter
  articleSearchFilter = '';
  selectedArticles: any[] = [];
  selectedMagasin: number | null = null;

  // Facture printing
  selectedCommandes: any[] = [];
  showFactureForm = false;
  showFacturePreview = false;
  nextFactureNumber = 'FACT-2024-001';
  factureCounter = 1;
  expandedCommandes = new Set<number>();
  generatedFacture: FactureData | null = null;
  isGeneratingFacture = false;

  // Popups d'alerte
  showMagasinAlert = false;
  showLoadingAlert = false;
  showNoStockAlert = false;
  showQuantityAlert = false;
  showUpdateErrorAlert = false;
  showCreateErrorAlert = false;
  showDeleteErrorAlert = false;
  showNoCommandeAlert = false;
  showDifferentClientAlert = false;
  showDateRangeAlert = false;
  showFactureSuccessAlert = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  totalItems = 0;

  // Math object for template
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private service: CommandeService,
    private fournisseurClientService: FournisseurClientService,
    private magasinService: MagasinService,
    private stockService: StockService,
    private factureService: FactureService,
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadCommandes();
    this.loadMagasins();
  }

  initForms(): void {
    this.commandeForm = this.fb.group({
      libelle: [''],
      dateCommande: [new Date().toISOString().substring(0, 10), Validators.required],
      clientId: ['', Validators.required],
      modePaiement: ['', Validators.required],
      lignes: [[]],
      magasinId: [null, Validators.required],
    });

    this.lineForm = this.fb.group({
      code: ['', Validators.required],
      reference: ['', Validators.required],
      description: ['', Validators.required],
      prixUnitaire: [0, [Validators.required, Validators.min(0)]],
      quantite: [1, [Validators.required, Validators.min(1)]],
      tauxTva: [19, [Validators.required, Validators.min(0), Validators.max(100)]],
    });

    this.factureForm = this.fb.group({
      numFacture: [this.nextFactureNumber, Validators.required],
      dateFacture: [new Date().toISOString().substring(0, 10), Validators.required],
      clientId: ['', Validators.required],
      commandes: [[], Validators.required],
    });
  }

  loadCommandes(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        data = (data || []).filter((commande: any) => commande.type === 'VENTE');

        // Trier les commandes par date de commande (du plus récent au plus ancien)
        data.sort((a: any, b: any) => {
          const dateA = new Date(a.dateCmd || a.dateCommande);
          const dateB = new Date(b.dateCmd || b.dateCommande);
          return dateB.getTime() - dateA.getTime();
        });

        this.allCommandes = data;
        this.commandes = data;
        this.filteredCommandes = [...data];
        this.totalItems = data.length;
        console.log('Commandes de vente triées par date:', data);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes de vente:', error);
      },
    });
    // Charger dynamiquement les clients
    this.fournisseurClientService.getAll().subscribe((data: any[]) => {
      this.clients = (data || []).filter((p: any) => p.type === 'CLIENT');
    });

    this.modesPaiement = [
      { idModePaiement: 1, nom: 'Espèces' },
      { idModePaiement: 2, nom: 'Chèque' },
      { idModePaiement: 3, nom: 'Virement' },
      { idModePaiement: 4, nom: 'Carte bancaire' },
    ];
  }

  loadMagasins(): void {
    console.log('Chargement des magasins...');
    this.magasinService.getAll().subscribe({
      next: (data) => {
        this.magasins = data || [];
        console.log('Magasins chargés:', this.magasins);

        // Charger les stocks pour chaque magasin
        this.magasins.forEach((magasin) => {
          this.loadStocksForMagasin(magasin.idMagasin);
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des magasins:', error);
        this.magasins = [];
      },
    });
  }

  // Charger les stocks pour un magasin spécifique
  loadStocksForMagasin(magasinId: number): void {
    console.log('Chargement des stocks pour le magasin:', magasinId);
    this.stockService.getStockByMagasin(magasinId).subscribe({
      next: (stocks) => {
        console.log(`Stocks chargés pour le magasin ${magasinId}:`, stocks);
        this.stocksByMagasin[magasinId] = stocks || [];
      },
      error: (error) => {
        console.error(`Erreur lors du chargement des stocks pour le magasin ${magasinId}:`, error);
        this.stocksByMagasin[magasinId] = [];
      },
    });
  }

  // Méthode pour extraire les articles avec stocks d'un magasin sélectionné
  getArticlesFromMagasin(magasinId: number): any[] {
    console.log("Recherche d'articles pour le magasin ID:", magasinId);
    console.log('Stocks disponibles par magasin:', this.stocksByMagasin);

    const stocks = this.stocksByMagasin[magasinId];
    console.log('Stocks pour ce magasin:', stocks);

    if (!stocks || stocks.length === 0) {
      console.log('Aucun stock trouvé pour le magasin:', magasinId);
      return [];
    }

    // Transformer les stocks en articles avec quantité
    const articlesWithStock = stocks.map((stock: any) => ({
      ...stock.article,
      stockDisponible: stock.qteStock || stock.quantite || 0,
      idStock: stock.idStock,
      qteStock: stock.qteStock || stock.quantite || 0,
      prix: stock.article?.prixVente || stock.article?.prix || stock.prix || 0, // Prix de vente
    }));

    console.log('Articles extraits du magasin:', articlesWithStock);
    return articlesWithStock;
  }

  // Méthode pour obtenir le stock d'un article dans un magasin spécifique
  getArticleStockInMagasin(articleId: number, magasinId: number): number {
    const stocks = this.stocksByMagasin[magasinId];
    if (!stocks) return 0;

    const stock = stocks.find((s: any) => s.article?.idArticle === articleId);
    return stock ? stock.qteStock || stock.quantite || 0 : 0;
  }

  // Filter methods
  applyFilters(): void {
    console.log('Application des filtres...');
    console.log('Filtres actuels:', this.filters);

    // Filtrer les commandes selon les critères
    this.filteredCommandes = this.allCommandes.filter((commande) => {
      // Filtre par libellé
      if (this.filters.libelle && !commande.libelle?.toLowerCase().includes(this.filters.libelle.toLowerCase())) {
        return false;
      }

      // Filtre par client
      if (this.filters.client && commande.client?.idPersonne != this.filters.client) {
        return false;
      }

      // Filtre par magasin
      if (this.filters.magasin && commande.magasin?.idMagasin != this.filters.magasin) {
        return false;
      }

      // Filtre par date de début et fin
      if (this.filters.dateDebut || this.filters.dateFin) {
        const commandeDate = new Date(commande.dateCmd || commande.dateCommande);

        if (this.filters.dateDebut) {
          const filterDateDebut = new Date(this.filters.dateDebut);
          if (commandeDate < filterDateDebut) {
            return false;
          }
        }

        if (this.filters.dateFin) {
          const filterDateFin = new Date(this.filters.dateFin);
          if (commandeDate > filterDateFin) {
            return false;
          }
        }
      }

      return true;
    });

    // Appliquer le tri après le filtrage
    this.sortCommandesByDate();

    // Mettre à jour le total et revenir à la première page
    this.totalItems = this.filteredCommandes.length;
    this.currentPage = 1;

    console.log('Résultat du filtrage:', {
      total: this.totalItems,
      filtered: this.filteredCommandes.length,
    });
  }

  clearFilters(): void {
    console.log('Effacement des filtres...');
    this.filters = {
      libelle: '',
      client: '',
      magasin: '',
      dateDebut: '',
      dateFin: '',
    };

    // Restaurer toutes les commandes
    this.filteredCommandes = [...this.allCommandes];

    // Appliquer le tri après avoir restauré les données
    this.sortCommandesByDate();

    this.totalItems = this.filteredCommandes.length;
    this.currentPage = 1;
    console.log('Filtres effacés, affichage de toutes les commandes:', this.filteredCommandes.length);
  }

  // Vérifier si des filtres sont actifs
  hasActiveFilters(): boolean {
    return (
      this.filters.libelle !== '' ||
      this.filters.client !== '' ||
      this.filters.magasin !== '' ||
      this.filters.dateDebut !== '' ||
      this.filters.dateFin !== ''
    );
  }

  // Obtenir le nombre de résultats filtrés
  getFilteredCount(): number {
    return this.filteredCommandes.length;
  }

  // Get filtered articles based on search (comme dans transfert)
  getFilteredArticles(): any[] {
    const magasinId = this.commandeForm.get('magasinId')?.value;
    if (!magasinId) return [];

    // Récupérer les articles du magasin sélectionné
    const articlesFromMagasin = this.getArticlesFromMagasin(parseInt(magasinId));

    return articlesFromMagasin
      .filter((article) => {
        const searchTerm = this.articleSearchFilter.toLowerCase().trim();
        if (!searchTerm) return true; // Si pas de recherche, afficher tous les articles

        // Recherche par code, référence ou description (critère "contient")
        return (
          article.code.toLowerCase().includes(searchTerm) ||
          article.reference.toLowerCase().includes(searchTerm) ||
          article.description.toLowerCase().includes(searchTerm)
        );
      })
      .filter((article) => article.stockDisponible > 0); // Seulement les articles en stock
  }

  // Get stock for selected magasin
  getArticleStock(article: any): number {
    return article.stockDisponible || 0;
  }

  // Get stock for article by code
  getArticleStockByCode(code: string): number {
    if (!this.selectedMagasin) return 0;
    const article = this.getFilteredArticles().find((a) => a.code === code);
    return article ? article.stockDisponible || 0 : 0;
  }

  // Get current stock for the line being edited
  getCurrentStock(): number | null {
    if (!this.showLineForm) return null;
    const code = this.lineForm.get('code')?.value;
    if (!code) return null;
    return this.getArticleStockByCode(code);
  }

  // Get max quantity for current line
  getMaxQuantity(): number {
    const stock = this.getCurrentStock();
    return stock || 999;
  }

  // Check if quantity exceeds stock
  isQuantityExceedingStock(): boolean {
    const quantity = this.lineForm.get('quantite')?.value || 0;
    const stock = this.getCurrentStock();
    return stock !== null && quantity > stock;
  }

  // Handle quantity change in line form
  onQuantityChange(): void {
    const quantity = this.lineForm.get('quantite')?.value || 0;
    const prixUnitaire = this.lineForm.get('prixUnitaire')?.value || 0;
    const sousTotal = quantity * prixUnitaire;

    // Update sous-total in the form for display
    this.lineForm.patchValue({ sousTotal });
  }

  // Update line quantity in table
  updateLineQuantity(index: number, event: any): void {
    const newQuantity = parseInt(event.target.value) || 1;
    const lignes = this.commandeForm.get('lignes')?.value || [];

    if (index >= 0 && index < lignes.length) {
      const line = lignes[index];
      const stockDisponible = line.stockDisponible || 0;

      // Vérifier que la quantité ne dépasse pas le stock disponible

      // Vérifier que la quantité est au moins égale à 1
      if (newQuantity > stockDisponible) {
        alert(`La quantité ne peut pas dépasser le stock disponible (${stockDisponible} unités)`);
        event.target.value = Math.min(newQuantity, stockDisponible);
        return;
      }

      // Mettre à jour la quantité et recalculer le sous-total
      line.quantite = newQuantity;
      line.sousTotal = line.prixUnitaire * newQuantity;

      this.commandeForm.patchValue({ lignes });
      this.updateTotals();
    }
  }

  // Get stock status class
  getStockStatusClass(stock: number): string {
    if (stock > 10) return 'bg-green-100 text-green-800';
    if (stock > 5) return 'bg-yellow-50 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  // Get selected magasin name
  getSelectedMagasinName(): string {
    const magasinId = this.commandeForm.get('magasinId')?.value;
    if (!magasinId) return '';
    const magasin = this.magasins.find((m) => m.idMagasin === parseInt(magasinId));
    return magasin ? magasin.nomMagasin : '';
  }

  // Get facture client name
  getFactureClientName(): string {
    const clientId = this.factureForm?.get('clientId')?.value;
    if (!clientId) return '';
    const client = this.clients.find((c) => c.idClient === clientId);
    return client ? client.nom : '';
  }

  // Generate next facture number
  generateNextFactureNumber(): string {
    const currentYear = new Date().getFullYear();
    const paddedCounter = this.factureCounter.toString().padStart(3, '0');
    return `FACT-${currentYear}-${paddedCounter}`;
  }

  // Update facture number
  updateFactureNumber(): void {
    this.nextFactureNumber = this.generateNextFactureNumber();
    if (this.factureForm) {
      this.factureForm.patchValue({ numFacture: this.nextFactureNumber });
    }
  }

  // Open article selection popup
  openArticleSelection(): void {
    // Vérifier si un magasin est sélectionné
    const magasinId = this.commandeForm.get('magasinId')?.value;
    if (!magasinId) {
      this.showMagasinAlert = true;
      return;
    }

    const magasinIdNum = parseInt(magasinId);

    // Vérifier si les stocks sont chargés pour ce magasin
    if (!this.stocksByMagasin[magasinIdNum]) {
      console.log('Stocks non encore chargés pour le magasin, chargement en cours...');
      this.loadStocksForMagasin(magasinIdNum);
      this.showLoadingAlert = true;
      return;
    }

    // Vérifier que le magasin a des articles en stock
    const articlesFromMagasin = this.getArticlesFromMagasin(magasinIdNum);
    if (articlesFromMagasin.length === 0) {
      this.showNoStockAlert = true;
      return;
    }

    this.articleSelectionPopUp = true;
    this.articleSearchFilter = '';
    this.selectedArticles = [];
    this.selectedMagasin = magasinIdNum;
  }

  // Toggle article selection (comme dans transfert)
  toggleArticleSelection(article: any): void {
    const index = this.selectedArticles.findIndex((a) => a.idArticle === article.idArticle);
    if (index > -1) {
      this.selectedArticles.splice(index, 1);
    } else {
      this.selectedArticles.push(article);
    }
  }

  // Check if article is selected (comme dans transfert)
  isArticleSelected(article: any): boolean {
    return this.selectedArticles.some((a) => a.idArticle === article.idArticle);
  }

  // Toggle select all articles (comme dans transfert)
  toggleSelectAll(): void {
    const filteredArticles = this.getFilteredArticles();
    if (this.selectedArticles.length === filteredArticles.length) {
      this.selectedArticles = [];
    } else {
      this.selectedArticles = [...filteredArticles];
    }
  }

  // Check if all articles are selected (comme dans transfert)
  isAllSelected(): boolean {
    const filteredArticles = this.getFilteredArticles();
    return filteredArticles.length > 0 && this.selectedArticles.length === filteredArticles.length;
  }

  // Add selected articles to commande (comme dans transfert)
  addSelectedArticles(): void {
    this.selectedArticles.forEach((article) => {
      const newLine = {
        code: article.code,
        reference: article.reference,
        description: article.description,
        prixUnitaire: article.prix || 0,
        quantite: 1,
        tauxTva: 19, // Taux TVA par défaut, peut être modifié par ligne
        sousTotal: article.prix || 0,
        stockDisponible: article.stockDisponible,
        idArticle: article.idArticle,
        idStock: article.idStock,
      };

      const lignes = this.commandeForm.get('lignes')?.value || [];
      lignes.push(newLine);
      this.commandeForm.patchValue({ lignes });
    });

    this.closeArticleSelection();
    this.updateTotals();
  }

  // Close article selection popup (comme dans transfert)
  closeArticleSelection(): void {
    this.articleSelectionPopUp = false;
    this.articleSearchFilter = '';
    this.selectedArticles = [];
  }

  // Méthodes pour fermer les popups d'alerte
  closeMagasinAlert(): void {
    this.showMagasinAlert = false;
  }

  closeLoadingAlert(): void {
    this.showLoadingAlert = false;
  }

  closeNoStockAlert(): void {
    this.showNoStockAlert = false;
  }

  closeFactureSuccessAlert(): void {
    this.showFactureSuccessAlert = false;
  }

  // Update client TVA rate and devise when client changes
  onClientChange(): void {
    const clientId = this.commandeForm.get('clientId')?.value;
    if (clientId) {
      const client = this.clients.find((c) => c.idClient === clientId);
      if (client) {
        // Mettre à jour le taux TVA par défaut pour les nouvelles lignes
        this.lineForm.patchValue({ tauxTva: client.tauxTva });

        // Récupérer et mettre à jour la devise du client
        let devise = '';
        if (client.devise) {
          if (typeof client.devise === 'object' && client.devise !== null) {
            devise = client.devise.code || client.devise.nom || client.devise.libelle || '';
          } else {
            devise = client.devise;
          }
        }

        // Mettre à jour le champ devise dans le formulaire
        this.commandeForm.patchValue({ devise: devise });

        console.log('Client sélectionné:', client.nomPersonne, 'Devise:', devise);
      }
    } else {
      // Si aucun client n'est sélectionné, vider le champ devise
      this.commandeForm.patchValue({ devise: '' });
    }
  }

  // Handle magasin change
  onMagasinChange(): void {
    const magasinId = this.commandeForm.get('magasinId')?.value;
    if (magasinId) {
      const magasinIdNum = parseInt(magasinId);
      if (!this.stocksByMagasin[magasinIdNum]) {
        console.log('Changement de magasin, chargement des stocks...');
        this.loadStocksForMagasin(magasinIdNum);
      }
    }
  }

  // Commande management
  saveCommande(): void {
    if (this.commandeForm.valid) {
      const formData = this.commandeForm.value;

      // Préparer les données selon le format de l'API
      const commandeData = {
        dateCmd: formData.dateCommande,
        montantTotal: this.calculateMontantTtc(),
        modePaiement: formData.modePaiement,
        type: 'VENTE',
        detailCmds: this.prepareDetailCmds(formData.lignes),
        personne: { idPersonne: formData.clientId },
        magasin: { idMagasin: formData.magasinId },
      };

      if (this.isEditing) {
        // Update existing commande via API
        this.service.update(this.selectdID, commandeData).subscribe({
          next: (updatedCommande) => {
            // Mettre à jour la liste locale
            const index = this.commandes.findIndex((c) => c.idCmd === this.selectdID);
            if (index !== -1) {
              this.commandes[index] = updatedCommande;
              this.filteredCommandes = [...this.commandes];
              this.totalItems = this.commandes.length;
            }
            this.closeModal();
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour de la commande:', error);
            this.showUpdateErrorAlert = true;
          },
        });
      } else {
        // Add new commande via API
        this.service.create(commandeData).subscribe({
          next: (createdCommande) => {
            // Ajouter à la liste locale
            this.commandes.push(createdCommande);
            this.filteredCommandes = [...this.commandes];
            this.totalItems = this.commandes.length;
            this.closeModal();
          },
          error: (error) => {
            console.error('Erreur lors de la création de la commande:', error);
            this.showCreateErrorAlert = true;
          },
        });
      }
    }
  }

  // Méthode pour préparer les détails de commande (comme dans transfert)
  prepareDetailCmds(lignes: any[]): any[] {
    return lignes.map((ligne: any) => ({
      idDetailCmd: ligne?.idDetailCmd,
      article: { idArticle: ligne.idArticle },
      quantite: ligne.quantite,
      prix: ligne.prixUnitaire,
    }));
  }

  editCommande(commande: any): void {
    this.selectdID = commande.idCmd;
    this.selectedCommande = commande;
    this.isEditing = true;

    // Normaliser les lignes pour garantir la présence de toutes les propriétés
    let lignes = commande.lignes || commande.detailCmds || [];
    lignes = lignes.map((l: any) => ({
      ...l,
      code: l.code || l.article?.code || '',
      reference: l.reference || l.ref || l.article?.reference || '',
      description: l.description || l.article?.description || '',
      prixUnitaire: l.prixUnitaire || l.prix || l.article?.prix || 0,
      tauxTva: l.tauxTva || l.tva || l.article?.tva || 19,
      idArticle: l.idArticle || l.article?.idArticle,
      idStock: l.idStock,
    }));

    // Récupérer la devise du client
    let devise = '';
    const clientId = commande?.personne?.idPersonne || commande?.clientId || '';
    if (clientId) {
      const client = this.clients.find((c) => c.idClient === clientId);
      if (client && client.devise) {
        if (typeof client.devise === 'object' && client.devise !== null) {
          devise = client.devise.code || client.devise.nom || client.devise.libelle || '';
        } else {
          devise = client.devise;
        }
      }
    }

    this.commandeForm.patchValue({
      libelle: commande.libelle || commande.libCmd,
      dateCommande:
        commande.dateCommande || (commande.dateCmd ? new Date(commande.dateCmd).toISOString().substring(0, 10) : ''),
      clientId: clientId,
      devise: devise,
      modePaiement: commande?.modePaiement || '',
      lignes,
      magasinId: commande?.magasin?.idMagasin || commande?.magasinId || '',
    });

    // Charger les stocks pour ce magasin si nécessaire
    const magasinId = commande?.magasin?.idMagasin || commande?.magasinId;
    if (magasinId && !this.stocksByMagasin[magasinId]) {
      this.loadStocksForMagasin(magasinId);
    }
    this.createPopUp = true;
  }

  deleteCommande(id: number): void {
    this.service.delete(id).subscribe({
      next: () => {
        // Mettre à jour la liste locale
        this.commandes = this.commandes.filter((c) => c.idCmd !== id);
        this.filteredCommandes = this.filteredCommandes.filter((c) => c.idCmd !== id);
        this.totalItems = this.commandes.length;
        this.selectdID = null;
        this.selectedCommande = null;
      },
      error: (error) => {
        console.error('Erreur lors de la suppression de la commande:', error);
        this.showDeleteErrorAlert = true;
      },
    });
  }

  viewDetails(commande: any): void {
    this.selectedCommande = commande;
    this.detailsPopUp = true;
  }

  // Line management
  addLine(): void {
    if (this.lineForm.valid) {
      const lineData = this.lineForm.value;
      const sousTotal = lineData.prixUnitaire * lineData.quantite;

      const newLine = {
        ...lineData,
        sousTotal: sousTotal,
      };

      const lignes = this.commandeForm.get('lignes')?.value || [];
      lignes.push(newLine);
      this.commandeForm.patchValue({ lignes });

      this.updateTotals();
      this.resetLineForm();
    }
  }

  editLine(index: number): void {
    const lignes = this.commandeForm.get('lignes')?.value || [];
    const line = lignes[index];

    this.lineForm.patchValue(line);
    this.currentLineIndex = index;
    this.showLineForm = true;
  }

  updateLine(): void {
    if (this.lineForm.valid && this.currentLineIndex !== null) {
      const lineData = this.lineForm.value;
      const sousTotal = lineData.prixUnitaire * lineData.quantite;

      const lignes = this.commandeForm.get('lignes')?.value || [];
      lignes[this.currentLineIndex] = {
        ...lineData,
        sousTotal: sousTotal,
      };

      this.commandeForm.patchValue({ lignes });
      this.updateTotals();
      this.resetLineForm();
    }
  }

  deleteLine(index: number): void {
    const lignes = this.commandeForm.get('lignes')?.value || [];
    lignes.splice(index, 1);
    this.commandeForm.patchValue({ lignes });
    this.updateTotals();
  }

  updateTotals(): void {
    const lignes = this.commandeForm.get('lignes')?.value || [];
    const montantHt = lignes.reduce((sum: number, line: any) => sum + line.sousTotal, 0);
    const montantTva = lignes.reduce((sum: number, line: any) => {
      const tauxTva = line.tauxTva || 19; // Taux par défaut si non défini
      return sum + line.sousTotal * (tauxTva / 100);
    }, 0);
    const montantTtc = montantHt + montantTva;

    // Update form values for display
    this.commandeForm.patchValue({
      montantHt: montantHt,
      montantTva: montantTva,
      montantTtc: montantTtc,
    });
  }

  calculateMontantHt(): number {
    const lignes = this.commandeForm.get('lignes')?.value || [];
    return lignes.reduce((sum: number, line: any) => sum + line.sousTotal, 0);
  }

  calculateMontantTva(): number {
    const lignes = this.commandeForm.get('lignes')?.value || [];
    return lignes.reduce((sum: number, line: any) => {
      const tauxTva = line.tauxTva || 19; // Taux par défaut si non défini
      return sum + line.sousTotal * (tauxTva / 100);
    }, 0);
  }

  calculateMontantTtc(): number {
    return this.calculateMontantHt() + this.calculateMontantTva();
  }

  resetLineForm(): void {
    this.lineForm.reset({
      code: '',
      reference: '',
      description: '',
      prixUnitaire: 0,
      quantite: 1,
      tauxTva: 19,
    });
    this.currentLineIndex = null;
    this.showLineForm = false;
  }

  // Modal management
  openModal(): void {
    this.createPopUp = true;
    this.isEditing = false;
    this.selectdID = null;
    this.selectedCommande = null;
    this.commandeForm.reset({
      dateCommande: new Date().toISOString().substring(0, 10),
      lignes: [],
      magasinId: null,
      libelle: '',
      clientId: '',
      devise: '',
      modePaiement: '',
    });
  }

  closeModal(): void {
    this.createPopUp = false;
    this.detailsPopUp = false;
    this.deletedPopUp = false;
    this.resetLineForm();
  }

  getLineStatusClass(): string {
    return 'bg-gray-50 border-l-4 border-gray-300';
  }

  // TrackBy function for performance
  trackByFn(index: number, item: any): any {
    return item.idCmd || index;
  }

  // Facture printing methods
  toggleCommandeSelection(commande: any): void {
    const index = this.selectedCommandes.findIndex((c) => c.idCmd === commande.idCmd);
    if (index > -1) {
      this.selectedCommandes.splice(index, 1);
    } else {
      this.selectedCommandes.push(commande);
    }
  }

  isCommandeSelected(commande: any): boolean {
    return this.selectedCommandes.some((c) => c.idCmd === commande.idCmd);
  }

  toggleSelectAllCommandes(): void {
    const currentPageCommandes = this.getPaginatedCommandes();
    const selectedOnCurrentPage = currentPageCommandes.filter((c) => this.isCommandeSelected(c));

    if (selectedOnCurrentPage.length === currentPageCommandes.length) {
      // Désélectionner toutes les commandes de la page courante
      currentPageCommandes.forEach((commande) => {
        const index = this.selectedCommandes.findIndex((c) => c.idCmd === commande.idCmd);
        if (index > -1) {
          this.selectedCommandes.splice(index, 1);
        }
      });
    } else {
      // Sélectionner toutes les commandes de la page courante
      currentPageCommandes.forEach((commande) => {
        if (!this.isCommandeSelected(commande)) {
          this.selectedCommandes.push(commande);
        }
      });
    }
  }

  isAllCommandesSelected(): boolean {
    return this.filteredCommandes.length > 0 && this.selectedCommandes.length === this.filteredCommandes.length;
  }

  toggleCommandeDetails(commandeId: number): void {
    if (this.expandedCommandes.has(commandeId)) {
      this.expandedCommandes.delete(commandeId);
    } else {
      this.expandedCommandes.add(commandeId);
    }
  }

  openFactureForm(): void {
    if (this.selectedCommandes.length === 0) {
      alert('Veuillez sélectionner au moins une commande pour générer une facture.');
      return;
    }

    // Vérifier que toutes les commandes sélectionnées appartiennent au même client
    const firstClientId = this.selectedCommandes[0]?.personne?.idPersonne || this.selectedCommandes[0]?.clientId;
    const allSameClient = this.selectedCommandes.every((cmd) => {
      const cmdClientId = cmd.personne?.idPersonne || cmd.clientId;
      return cmdClientId === firstClientId;
    });

    if (!allSameClient) {
      alert('Toutes les commandes sélectionnées doivent appartenir au même client.');
      return;
    }

    this.updateFactureNumber();
    this.factureForm.patchValue({
      numFacture: this.nextFactureNumber,
      dateFacture: new Date().toISOString().substring(0, 10),
      clientId: firstClientId,
      commandes: this.selectedCommandes.map((cmd) => cmd.idCmd),
    });

    this.showFactureForm = true;
  }

  closeFactureForm(): void {
    this.showFactureForm = false;
    this.selectedCommandes = [];
  }

  closeFacturePreview(): void {
    this.showFacturePreview = false;
    this.generatedFacture = null;
    this.selectedCommandes = [];
  }

  printGeneratedFacture(): void {
    if (this.generatedFacture) {
      const factureHtml = this.generateFactureHtml(this.generatedFacture);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(factureHtml);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }

  printFacture(): void {
    window.print();
  }

  generateFactureHtml(factureData: any): string {
    const client = this.clients.find(
      (c) => c.idPersonne === factureData.clientId || c.idClient === factureData.clientId,
    );
    const clientName = client ? client.nomPersonne : 'Client inconnu';
    const clientDevise = client?.devise?.code || 'TND';

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Facture ${factureData.numFacture}</title>
        <style>
          @page {
            size: A4;
            margin: 1cm;
          }
          
          * {
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: white;
            color: #000;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .facture-container {
            max-width: 21cm;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border: 2px solid #000;
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          
          .header h1 {
            color: #000;
            margin: 0;
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .header h2 {
            color: #000;
            margin: 5px 0 0 0;
            font-size: 16px;
            font-weight: normal;
          }
          
          .company-info {
            text-align: left;
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #000;
            background: #f9f9f9;
          }
          
          .company-info h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .company-info p {
            margin: 2px 0;
            font-size: 11px;
          }
          
          .facture-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #000;
          }
          
          .facture-details .left, .facture-details .right {
            flex: 1;
          }
          
          .facture-details h4 {
            margin: 0 0 8px 0;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .facture-details p {
            margin: 2px 0;
            font-size: 11px;
          }
          
          .client-info { 
            margin-bottom: 20px; 
            padding: 10px;
            border: 1px solid #000;
            background: #f9f9f9;
          }
          
          .client-info h3 {
            margin: 0 0 8px 0;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .client-info p {
            margin: 2px 0;
            font-size: 11px;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
            border: 1px solid #000;
          }
          
          th, td { 
            border: 1px solid #000; 
            padding: 6px; 
            text-align: left; 
            font-size: 10px;
            vertical-align: top;
          }
          
          th { 
            background: #f0f0f0;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
          }
          
          .totals { 
            text-align: right; 
            margin-top: 20px; 
            padding: 10px;
            border: 1px solid #000;
            background: #f9f9f9;
          }
          
          .total-line { 
            margin: 3px 0; 
            font-size: 11px;
          }
          
          .total-ttc {
            font-size: 14px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 10px;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          
          .footer p {
            margin: 2px 0;
          }
          
          .logo {
            max-width: 120px;
            max-height: 60px;
            margin-bottom: 10px;
          }
          
          .legal-notice {
            margin-top: 20px;
            padding: 10px;
            border: 1px solid #000;
            background: #f9f9f9;
            font-size: 9px;
          }
          
          .legal-notice h4 {
            margin: 0 0 5px 0;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .legal-notice p {
            margin: 2px 0;
          }
          
          .signature-section {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
          }
          
          .signature-box {
            width: 45%;
            text-align: center;
            padding: 10px;
            border: 1px solid #000;
          }
          
          .signature-box h4 {
            margin: 0 0 20px 0;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 30px;
            padding-top: 5px;
            font-size: 9px;
          }
          
          @media print {
            body { 
              margin: 0; 
              background: white;
            }
            .facture-container {
              border: none;
              padding: 0;
            }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="facture-container">
          <!-- En-tête -->
          <div class="header">
            <img src="assets/LOGO_Gesti.png" alt="Logo" class="logo">
            <h1>FACTURE</h1>
            <h2>${factureData.numFacture}</h2>
          </div>

          <!-- Informations de l'entreprise -->
          <div class="company-info">
            <h3>Informations de l'entreprise</h3>
            <p><strong>Raison sociale:</strong> ${FACTURE_CONFIG.company.raisonSociale}</p>
            <p><strong>Adresse:</strong> ${FACTURE_CONFIG.company.adresse}</p>
            <p><strong>Téléphone:</strong> ${FACTURE_CONFIG.company.telephone}</p>
            <p><strong>Email:</strong> ${FACTURE_CONFIG.company.email}</p>
            <p><strong>Matricule fiscale:</strong> ${FACTURE_CONFIG.company.matriculeFiscale}</p>
            <p><strong>Code TVA:</strong> ${FACTURE_CONFIG.company.codeTVA}</p>
            ${
              FACTURE_CONFIG.company.siteWeb
                ? `<p><strong>Site web:</strong> ${FACTURE_CONFIG.company.siteWeb}</p>`
                : ''
            }
            ${
              FACTURE_CONFIG.company.capital ? `<p><strong>Capital:</strong> ${FACTURE_CONFIG.company.capital}</p>` : ''
            }
            ${
              FACTURE_CONFIG.company.registreCommerce
                ? `<p><strong>Registre de commerce:</strong> ${FACTURE_CONFIG.company.registreCommerce}</p>`
                : ''
            }
          </div>

          <!-- Détails de la facture -->
          <div class="facture-details">
            <div class="left">
              <h4>Informations de facturation</h4>
              <p><strong>Date de facture:</strong> ${new Date(factureData.datefacture).toLocaleDateString('fr-FR')}</p>
              <p><strong>Numéro de facture:</strong> ${factureData.numFacture}</p>
              <p><strong>ID Facture:</strong> ${factureData.idFacture}</p>
              <p><strong>Mode de paiement:</strong> À définir</p>
            </div>
            <div class="right">
              <h4>Informations client</h4>
              <p><strong>Nom/Raison sociale:</strong> ${clientName}</p>
              ${client?.adresse ? `<p><strong>Adresse:</strong> ${client.adresse}</p>` : ''}
              ${client?.telephone ? `<p><strong>Téléphone:</strong> ${client.telephone}</p>` : ''}
              ${client?.email ? `<p><strong>Email:</strong> ${client.email}</p>` : ''}
              ${client?.codeClient ? `<p><strong>Code client:</strong> ${client.codeClient}</p>` : ''}
              ${client?.devise ? `<p><strong>Devise:</strong> ${client.devise.code || client.devise}</p>` : ''}
            </div>
          </div>

          <!-- Tableau des commandes -->
          <table>
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Date Commande</th>
                <th>Libellé</th>
                <th>Montant HT</th>
                                 <th>TVA (${FACTURE_CONFIG.tvaRate}%)</th>
                <th>Montant TTC</th>
              </tr>
            </thead>
            <tbody>
              ${this.selectedCommandes
                .map(
                  (commande: any) => `
                <tr>
                  <td><strong>CMD-${commande.idCmd}</strong></td>
                  <td>${new Date(commande.dateCmd || commande.dateCommande).toLocaleDateString('fr-FR')}</td>
                  <td>${commande.libelle || commande.libCmd}</td>
                  <td style="text-align: right;">${(commande.montantHt || 0).toFixed(3)} ${clientDevise}</td>
                  <td style="text-align: right;">${(commande.montantTva || 0).toFixed(3)} ${clientDevise}</td>
                  <td style="text-align: right;"><strong>${(commande.montantTtc || commande.montantTotal || 0).toFixed(
                    3,
                  )} ${clientDevise}</strong></td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>

          <!-- Totaux -->
          <div class="totals">
            <div class="total-line">
              <strong>Total HT:</strong> ${factureData.totalHT.toFixed(3)} ${clientDevise}
            </div>
            <div class="total-line">
              <strong>Total TVA (${FACTURE_CONFIG.tvaRate}%):</strong> ${factureData.totalTva.toFixed(
      3,
    )} ${clientDevise}
            </div>
            <div class="total-line total-ttc">
              <strong>Total TTC:</strong> ${factureData.totalTTC.toFixed(3)} ${clientDevise}
            </div>
            <div class="total-line" style="margin-top: 10px;">
              <strong>Arrondi:</strong> ${Math.round(factureData.totalTTC)} ${clientDevise}
            </div>
          </div>

          <!-- Mentions légales -->
          <div class="legal-notice">
            <h4>Mentions légales</h4>
            <p><strong>Conformément à la législation fiscale tunisienne :</strong></p>
            ${FACTURE_CONFIG.legalNotice.map((notice) => `<p>• ${notice}</p>`).join('')}
          </div>

          <!-- Section signatures -->
          <div class="signature-section">
            <div class="signature-box">
              <h4>Signature du client</h4>
              <div class="signature-line">Signature et cachet</div>
            </div>
            <div class="signature-box">
              <h4>Signature de l'entreprise</h4>
              <div class="signature-line">Signature et cachet</div>
            </div>
          </div>

          <!-- Pied de page -->
          <div class="footer">
            <p><strong>${FACTURE_CONFIG.company.raisonSociale}</strong></p>
            <p>${FACTURE_CONFIG.footerText}</p>
            <p>Matricule fiscale: ${FACTURE_CONFIG.company.matriculeFiscale} | Code TVA: ${
      FACTURE_CONFIG.company.codeTVA
    }</p>
            <p>Facture générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString(
      'fr-FR',
    )}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Pagination methods
  getPaginatedCommandes(): any[] {
    // Sort by libelle/libCmd before pagination (descending string order)
    const sortedCommandes = [...this.filteredCommandes].sort((a: any, b: any) => {
      const libelleA = (a.libelle || a.libCmd || '').toString();
      const libelleB = (b.libelle || b.libCmd || '').toString();

      // Sort in descending alphabetical order
      return libelleB.localeCompare(libelleA); // Descending: "Commande 4" comes before "Commande 3"
    });

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return sortedCommandes.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getPageNumbers(): number[] {
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    const pages: number[] = [];

    // Afficher maximum 5 pages autour de la page courante
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Ajout des méthodes utilitaires pour affichage dynamique
  getClientName(clientId: any): string {
    if (!clientId) return '';
    // Si c'est déjà un nom (string sans chiffre), retourne directement
    if (typeof clientId === 'string' && isNaN(Number(clientId))) return clientId;
    // Recherche par idPersonne ou idClient
    const client = this.clients.find((c) => c.idPersonne === clientId || c.idClient === clientId);
    return client ? client.nomPersonne || client.nom : clientId;
  }

  // Méthode pour calculer les totaux des commandes sélectionnées avec gestion des données manquantes
  calculateFactureTotalHt(): number {
    return this.selectedCommandes.reduce((total, commande) => {
      const montantHt = commande.montantHt || 0;
      return total + montantHt;
    }, 0);
  }

  calculateFactureTotalTva(): number {
    return this.selectedCommandes.reduce((total, commande) => {
      const montantTva = commande.montantTva || 0;
      return total + montantTva;
    }, 0);
  }

  calculateFactureTotal(): number {
    return this.selectedCommandes.reduce((total, commande) => {
      const montantTtc = commande.montantTtc || commande.montantTotal || 0;
      return total + montantTtc;
    }, 0);
  }

  getMagasinName(magasinId: any): string {
    if (!magasinId) return '';
    // Si c'est déjà un nom (string sans chiffre), retourne directement
    if (typeof magasinId === 'string' && isNaN(Number(magasinId))) return magasinId;
    // Recherche par idMagasin
    const magasin = this.magasins.find((m) => m.idMagasin === magasinId || m.nomMagasin === magasinId);
    return magasin ? magasin.nomMagasin || magasin.nom : magasinId;
  }

  getClientDevise(clientId: any): string {
    if (!clientId) return '';
    // Recherche par idPersonne ou idClient
    const client = this.clients.find((c) => c.idPersonne === clientId || c.idClient === clientId);
    if (!client) return '-';
    if (client.devise) {
      if (typeof client.devise === 'object' && client.devise !== null) {
        return client.devise.code || client.devise.nom || client.devise.libelle || '-';
      }
      return client.devise;
    }
    return '-';
  }

  // Affichage de la devise du client sélectionné dans le formulaire (popup)
  get getDevise(): string {
    const clientId = this.commandeForm.get('clientId')?.value;
    const client = this.clients.find((c) => c.idPersonne == clientId || c.idClient == clientId);
    if (client) return client?.devise?.devise ?? 'N/A';
    return 'N/A';
  }

  get getCofDevise(): number {
    const clientId = this.commandeForm.get('clientId')?.value;
    const client = this.clients.find((c) => c.idPersonne == clientId || c.idClient == clientId);
    const devise = client?.devise;
    return devise?.tauxChange || 1;
  }

  toFix(prix: number) {
    return parseFloat(prix.toFixed(2));
  }

  // Obtenir le symbole de devise pour l'affichage des montants
  get getDeviseSymbol(): string {
    const clientId = this.commandeForm.get('clientId')?.value;
    const client = this.clients.find((c) => c.idPersonne == clientId || c.idClient == clientId);
    if (client && client.devise) {
      if (typeof client.devise === 'object' && client.devise !== null) {
        return client.devise.symbole || client.devise.code || client.devise.nom || '€';
      }
      return client.devise;
    }
    return '€';
  }

  // Obtenir le symbole de devise pour une commande spécifique (pour la popup de détails)
  getDeviseSymbolForCommande(commande: any): string {
    if (!commande) return '€';

    const clientId = commande?.personne?.idPersonne || commande?.clientId || commande?.client;
    const client = this.clients.find((c) => c.idPersonne == clientId || c.idClient == clientId);
    if (client && client.devise) {
      if (typeof client.devise === 'object' && client.devise !== null) {
        return client.devise.symbole || client.devise.code || client.devise.nom || '€';
      }
      return client.devise;
    }
    return '€';
  }

  // Obtenir le client sélectionné pour la facture
  getSelectedClient(): any {
    if (this.selectedCommandes.length === 0) return null;
    const clientId = this.selectedCommandes[0]?.personne?.idPersonne || this.selectedCommandes[0]?.clientId;
    return this.clients.find((c) => c.idPersonne === clientId || c.idClient === clientId);
  }

  // Obtenir le symbole de devise du client sélectionné
  getClientDeviseSymbol(): string {
    const client = this.getSelectedClient();
    if (client && client.devise) {
      if (typeof client.devise === 'object' && client.devise !== null) {
        return client.devise.symbole || client.devise.code || client.devise.nom || 'TND';
      }
      return client.devise;
    }
    return 'TND';
  }

  // Appliquer les filtres automatiquement quand les valeurs changent
  onFilterChange(): void {
    // Appliquer les filtres avec un délai pour éviter trop d'appels
    setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  // Validation des dates
  validateDateRange(): boolean {
    if (this.filters.dateDebut && this.filters.dateFin) {
      const dateDebut = new Date(this.filters.dateDebut);
      const dateFin = new Date(this.filters.dateFin);
      return dateDebut <= dateFin;
    }
    return true;
  }

  // Appliquer les filtres avec validation
  applyFiltersWithValidation(): void {
    if (!this.validateDateRange()) {
      alert('La date de début doit être antérieure ou égale à la date de fin');
      return;
    }
    this.applyFilters();
  }

  // Méthode pour trier les commandes par date (du plus récent au plus ancien)
  sortCommandesByDate(): void {
    this.filteredCommandes.sort((a: any, b: any) => {
      const dateA = new Date(a.dateCmd || a.dateCommande);
      const dateB = new Date(b.dateCmd || b.dateCommande);
      return dateB.getTime() - dateA.getTime();
    });
  }

  // Calculate Montant HT for a commande (sum of quantite * article.prix)
  public getCommandeMontantHt(commande: any): number {
    const lignes = commande.detailCmds || commande.lignes || [];
    return lignes.reduce((sum: number, l: any) => sum + l.quantite * (l.article?.prix || 0), 0);
  }

  // Calculate Montant TTC for a commande (sum of quantite * article.prix * (1 + tva/100))
  public getCommandeMontantTtc(commande: any): number {
    const lignes = commande.detailCmds || commande.lignes || [];
    return lignes.reduce(
      (sum: number, l: any) => sum + l.quantite * (l.article?.prix || 0) * (1 + (l.article?.tva || 0) / 100),
      0,
    );
  }

  // Calculate total HT for all selected commandes
  public getFactureTotalHt(): number {
    return this.selectedCommandes.reduce(
      (total: number, commande: any) => total + this.getCommandeMontantHt(commande),
      0,
    );
  }

  // Calculate total TTC for all selected commandes
  public getFactureTotalTtc(): number {
    return this.selectedCommandes.reduce(
      (total: number, commande: any) => total + this.getCommandeMontantTtc(commande),
      0,
    );
  }

  // Calculate total TVA for all selected commandes
  public getFactureTotalTva(): number {
    return this.getFactureTotalTtc() - this.getFactureTotalHt();
  }

  generateFacturePdf(): void {
    window.print();
  }
}
