import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommandeService } from 'src/app/core/services/commande.service';
import { PopupComponent } from '../../shared/popup/popup.component';
import { MagasinService } from 'src/app/core/services/magasin.service';

@Component({
  selector: 'app-cmdtransfert',
  templateUrl: './cmdtransfert.component.html',
  styleUrls: ['./cmdtransfert.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PopupComponent],
  standalone: true,
})
export class CmdTransfertComponent implements OnInit {
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
  magasins: any[] = []; // Liste des magasins avec leurs stocks
  articles: any[] = [];
  articlesWithStock: any[] = [];

  // Forms
  commandeForm!: FormGroup;
  lineForm!: FormGroup;

  // State management
  isEditing = false;
  showLineForm = false;
  currentLineIndex: number | null = null;

  // Filters
  filters = {
    libelle: '',
    magasinSource: '',
    magasinDestination: '',
    dateDebut: '',
    dateFin: '',
  };

  // Article search filter
  articleSearchFilter = '';
  selectedArticles: any[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  filteredCommandes: any[] = [];

  // Math object for template
  Math = Math;

  constructor(private fb: FormBuilder, private service: CommandeService, private magasinService: MagasinService) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadMagasins();
  }

  initForms(): void {
    this.commandeForm = this.fb.group({
      libelle: [''],
      dateCommande: [new Date().toISOString().substring(0, 10), Validators.required],
      magasinSourceId: ['', Validators.required],
      magasinDestinationId: ['', Validators.required],
      lignes: [[]],
    });

    this.lineForm = this.fb.group({
      code: ['', Validators.required],
      reference: ['', Validators.required],
      description: ['', Validators.required],
      quantite: [1, [Validators.required, Validators.min(1)]],
    });
  }

  loadData(): void {
    console.log('Chargement des données...');
    this.commandes = [];
    this.filteredCommandes = [];
    this.totalItems = 0;
    this.magasins = [];
    this.articles = [];
    this.articlesWithStock = [];

    // Charger les commandes de transfert depuis le service
    this.service.getAll().subscribe({
      next: (data) => {
        console.log('Données brutes reçues:', data);

        // Filtrer pour ne garder que les commandes de transfert
        const commandesTransfert = (data || []).filter(
          (commande: any) => commande.type === 'TRANSFERT' || commande.type === 'transfert' || !commande.type, // Si pas de type, on considère que c'est un transfert
        );

        console.log('Commandes de transfert filtrées:', commandesTransfert);

        this.commandes = commandesTransfert;
        this.filteredCommandes = [...commandesTransfert];
        this.totalItems = commandesTransfert.length;

        console.log('Données finales chargées:', {
          total: this.totalItems,
          commandes: this.commandes.length,
          filtered: this.filteredCommandes.length,
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes de transfert:', error);
        this.commandes = [];
        this.filteredCommandes = [];
        this.totalItems = 0;
      },
    });
  }

  loadMagasins(): void {
    console.log('Chargement des magasins avec stocks...');
    this.magasinService.getAll().subscribe({
      next: (data) => {
        this.magasins = data || [];
        console.log('Magasins avec stocks chargés:', this.magasins);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des magasins:', error);
        this.magasins = [];
      },
    });
  }

  // Méthode pour extraire les articles avec stocks d'un magasin sélectionné
  getArticlesFromMagasin(magasinId: number): any[] {
    const magasin = this.magasins.find((m) => m.idMagasin == magasinId);
    if (!magasin || !magasin.stocks) {
      console.log('Magasin non trouvé ou pas de stocks:', magasinId);
      return [];
    }

    // Transformer les stocks en articles avec quantité
    const articlesWithStock = magasin.stocks.map((stock: any) => ({
      ...stock.article,
      stockDisponible: stock.qteStock,
      idStock: stock.idStock,
      qteStock: stock.qteStock,
    }));

    console.log('Articles extraits du magasin:', articlesWithStock);
    return articlesWithStock;
  }

  // Méthode pour obtenir le stock d'un article dans un magasin spécifique
  getArticleStockInMagasin(articleId: number, magasinId: number): number {
    const magasin = this.magasins.find((m) => m.idMagasin === magasinId);
    if (!magasin || !magasin.stocks) return 0;

    const stock = magasin.stocks.find((s: any) => s.article.idArticle === articleId);
    return stock ? stock.qteStock : 0;
  }

  // Get filtered articles based on search
  getFilteredArticles(): any[] {
    const magasinSourceId = this.commandeForm.get('magasinSourceId')?.value;
    if (!magasinSourceId) return [];

    // Récupérer les articles du magasin source sélectionné
    const articlesFromMagasin = this.getArticlesFromMagasin(magasinSourceId);

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
      .filter((article) => article.stockDisponible > 0);
  }

  // Open article selection popup
  openArticleSelection(): void {
    const magasinSourceId = this.commandeForm.get('magasinSourceId')?.value;
    if (!magasinSourceId) {
      alert("Veuillez d'abord sélectionner un magasin source");
      return;
    }

    // Vérifier que le magasin a des articles en stock
    const articlesFromMagasin = this.getArticlesFromMagasin(magasinSourceId);
    if (articlesFromMagasin.length === 0) {
      alert('Aucun article disponible en stock dans ce magasin');
      return;
    }

    this.articleSelectionPopUp = true;
    this.articleSearchFilter = '';
    this.selectedArticles = [];
  }

  // Toggle article selection
  toggleArticleSelection(article: any): void {
    const index = this.selectedArticles.findIndex((a) => a.idArticle === article.idArticle);
    if (index > -1) {
      this.selectedArticles.splice(index, 1);
    } else {
      this.selectedArticles.push(article);
    }
  }

  // Check if article is selected
  isArticleSelected(article: any): boolean {
    return this.selectedArticles.some((a) => a.idArticle === article.idArticle);
  }

  // Toggle select all articles
  toggleSelectAll(): void {
    const filteredArticles = this.getFilteredArticles();
    if (this.selectedArticles.length === filteredArticles.length) {
      this.selectedArticles = [];
    } else {
      this.selectedArticles = [...filteredArticles];
    }
  }

  // Check if all articles are selected
  isAllSelected(): boolean {
    const filteredArticles = this.getFilteredArticles();
    return filteredArticles.length > 0 && this.selectedArticles.length === filteredArticles.length;
  }

  // Add selected articles to commande
  addSelectedArticles(): void {
    this.selectedArticles.forEach((article) => {
      const newLine = {
        code: article.code,
        reference: article.reference,
        description: article.description,
        quantite: 1,
        prix: article.prix || 0,
        tva: article.tva || 0,
        stockDisponible: article.stockDisponible,
        idArticle: article.idArticle,
        idStock: article.idStock,
      };

      const lignes = this.commandeForm.get('lignes')?.value || [];
      lignes.push(newLine);
      this.commandeForm.patchValue({ lignes });
    });

    this.closeArticleSelection();
  }

  // Close article selection popup
  closeArticleSelection(): void {
    this.articleSelectionPopUp = false;
    this.articleSearchFilter = '';
    this.selectedArticles = [];
  }

  // Filter methods
  applyFilters(): void {
    this.filteredCommandes = this.commandes.filter((commande) => {
      // Filtre par libellé
      if (this.filters.libelle && !commande.libelle?.toLowerCase().includes(this.filters.libelle.toLowerCase())) {
        return false;
      }

      // Filtre par magasin source
      if (this.filters.magasinSource) {
        const magasinSource = this.formatMagasinDisplay(commande.magasinSource);
        if (!magasinSource.toLowerCase().includes(this.filters.magasinSource.toLowerCase())) {
          return false;
        }
      }

      // Filtre par magasin destination
      if (this.filters.magasinDestination) {
        const magasinDestination = this.formatMagasinDisplay(commande.magasinDestination);
        if (!magasinDestination.toLowerCase().includes(this.filters.magasinDestination.toLowerCase())) {
          return false;
        }
      }

      // Filtre par date de début
      if (this.filters.dateDebut && commande.dateCommande < this.filters.dateDebut) {
        return false;
      }

      // Filtre par date de fin
      if (this.filters.dateFin && commande.dateCommande > this.filters.dateFin) {
        return false;
      }

      return true;
    });

    // Mettre à jour le total et revenir à la première page
    this.totalItems = this.filteredCommandes.length;
    this.currentPage = 1;

    console.log('Filtres appliqués:', this.filters);
    console.log('Commandes filtrées:', this.filteredCommandes.length);
  }

  clearFilters(): void {
    this.filters = {
      libelle: '',
      magasinSource: '',
      magasinDestination: '',
      dateDebut: '',
      dateFin: '',
    };

    // Réinitialiser les commandes filtrées
    this.filteredCommandes = [...this.commandes];
    this.totalItems = this.filteredCommandes.length;
    this.currentPage = 1;
  }

  // Commande management
  saveCommande(): void {
    if (this.commandeForm.valid) {
      const formData = this.commandeForm.value;
      console.log('Sauvegarde - Données du formulaire:', formData);

      // Préparer les données selon le format de l'API
      const commandeData = {
        dateCmd: formData.dateCommande,
        montantTotal: this.calculateTotalAmount(formData.lignes),
        modePaiement: 'TRANSFERT', // Mode de paiement par défaut pour les transferts
        dateLivraison: formData.dateCommande, // Date de livraison = date de commande pour les transferts
        type: 'TRANSFERT', // Type de commande pour les transferts
        statut: 'LANCE', // Statut initial
        detailCmds: this.prepareDetailCmds(formData.lignes),
        magasinSource: { idMagasin: formData.magasinSourceId },
        magasinDestination: { idMagasin: formData.magasinDestinationId }
      };

      console.log('Données préparées pour l\'API:', commandeData);

      if (this.isEditing) {
        console.log('Mode édition - Mise à jour de la commande ID:', this.selectdID);
        
        // Update existing commande via API
        this.service.update(this.selectdID, commandeData).subscribe({
          next: (updatedCommande) => {
            console.log('Commande mise à jour via API:', updatedCommande);
            
            // Mettre à jour la liste locale
            const index = this.commandes.findIndex(c => c.idCmd === this.selectdID);
            if (index !== -1) {
              this.commandes[index] = updatedCommande;
              this.filteredCommandes = [...this.commandes];
              this.totalItems = this.commandes.length;
            }
            
            this.closeModal();
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour de la commande:', error);
            alert('Erreur lors de la mise à jour de la commande');
          }
        });
      } else {
        console.log('Mode création - Nouvelle commande');
        
        // Add new commande via API
        this.service.create(commandeData).subscribe({
          next: (createdCommande) => {
            console.log('Nouvelle commande créée via API:', createdCommande);
            
            // Ajouter à la liste locale
            this.commandes.push(createdCommande);
            this.filteredCommandes = [...this.commandes];
            this.totalItems = this.commandes.length;
            
            this.closeModal();
          },
          error: (error) => {
            console.error('Erreur lors de la création de la commande:', error);
            alert('Erreur lors de la création de la commande');
          }
        });
      }
    } else {
      console.error('Formulaire invalide:', this.commandeForm.errors);
      alert('Veuillez remplir tous les champs obligatoires');
    }
  }

  // Méthode pour calculer le montant total
  calculateTotalAmount(lignes: any[]): number {
    if (!lignes || lignes.length === 0) return 0;
    
    return lignes.reduce((total, ligne) => {
      const prix = ligne.prix || 0;
      const quantite = ligne.quantite || 1;
      const tva = ligne.tva || 0;
      
      const montantHT = prix * quantite;
      const montantTVA = montantHT * (tva / 100);
      const montantTTC = montantHT + montantTVA;
      
      return total + montantTTC;
    }, 0);
  }

  // Méthode pour préparer les détails de commande
  prepareDetailCmds(lignes: any[]): any[] {
    if (!lignes || lignes.length === 0) return [];
    
    return lignes.map((ligne, index) => ({
      quantite: ligne.quantite || 1,
      prixUnitaire: ligne.prix || 0,
      tauxTva: ligne.tva || 0,
      article: {
        idArticle: ligne.idArticle
      },
      // Les autres champs seront gérés par le backend
      idDetailCmd: ligne.idDetailCmd || null
    }));
  }

  editCommande(commande: any): void {
    console.log('Édition de la commande:', commande);

    this.selectdID = commande.idCmd;
    this.selectedCommande = commande;
    this.isEditing = true;

    // Récupérer le libellé de la commande
    const libelle = commande.libelle || commande.libCmd || '';
    console.log('Libellé récupéré:', libelle);

    // Récupérer la date de commande
    const dateCommande =
      commande.dateCommande ||
      (commande.dateCmd ? new Date(commande.dateCmd).toISOString().substring(0, 10) : '') ||
      new Date().toISOString().substring(0, 10);
    console.log('Date commande récupérée:', dateCommande);

    // Trouver les IDs des magasins source et destination
    console.log('Magasins disponibles:', this.magasins);
    console.log('Magasin source de la commande:', commande.magasinSource);
    console.log('Magasin destination de la commande:', commande.magasinDestination);

    // Récupérer les IDs des magasins selon la structure de l'API
    const magasinSourceId = commande.magasinSource?.idMagasin || 
      this.magasins.find(m => m.nomMagasin === commande.magasinSource?.nomMagasin)?.idMagasin;

    const magasinDestinationId = commande.magasinDestination?.idMagasin || 
      this.magasins.find(m => m.nomMagasin === commande.magasinDestination?.nomMagasin)?.idMagasin;

    console.log('ID magasin source trouvé:', magasinSourceId);
    console.log('ID magasin destination trouvé:', magasinDestinationId);

    // Préparer les lignes selon la structure de l'API
    const lignes = (commande.lignes || commande.detailCmds || []).map((detail: any) => ({
      code: detail.article?.code || detail.code || '',
      reference: detail.article?.reference || detail.reference || '',
      description: detail.article?.description || detail.description || '',
      quantite: detail.quantite || 1,
      prix: detail.prixUnitaire || detail.prix || 0,
      tva: detail.tauxTva || detail.tva || 0,
      stockDisponible: detail.stockDisponible || 0,
      idArticle: detail.article?.idArticle || detail.idArticle,
      idStock: detail.idStock,
      idDetailCmd: detail.idDetailCmd
    }));

    // Préparer les données du formulaire
    const formData = {
      libelle: libelle,
      dateCommande: dateCommande,
      magasinSourceId: magasinSourceId || '',
      magasinDestinationId: magasinDestinationId || '',
      lignes: lignes,
    };

    console.log('Données du formulaire à appliquer:', formData);

    // Appliquer les données au formulaire
    this.commandeForm.patchValue(formData);

    // Vérifier que les données ont été appliquées
    console.log('Valeurs du formulaire après patch:', this.commandeForm.value);

    this.createPopUp = true;
  }

  deleteCommande(id: number): void {
    // Supprimer via l'API
    this.service.delete(id).subscribe({
      next: () => {
        console.log('Commande supprimée via API:', id);
        
        // Mettre à jour la liste locale
        this.commandes = this.commandes.filter((c) => c.idCmd !== id);
        this.filteredCommandes = this.filteredCommandes.filter((c) => c.idCmd !== id);
        this.totalItems = this.commandes.length;
        this.selectdID = null;
        this.selectedCommande = null;
      },
      error: (error) => {
        console.error('Erreur lors de la suppression de la commande:', error);
        alert('Erreur lors de la suppression de la commande');
      }
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

      const newLine = {
        ...lineData,
      };

      const lignes = this.commandeForm.get('lignes')?.value || [];
      lignes.push(newLine);
      this.commandeForm.patchValue({ lignes });

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

      const lignes = this.commandeForm.get('lignes')?.value || [];
      lignes[this.currentLineIndex] = {
        ...lineData,
      };

      this.commandeForm.patchValue({ lignes });
      this.resetLineForm();
    }
  }

  deleteLine(index: number): void {
    const lignes = this.commandeForm.get('lignes')?.value || [];
    lignes.splice(index, 1);
    this.commandeForm.patchValue({ lignes });
  }

  // Méthode pour mettre à jour la quantité directement dans le tableau
  updateLineQuantity(index: number, event: any): void {
    const newQuantity = parseInt(event.target.value) || 1;
    const lignes = this.commandeForm.get('lignes')?.value || [];
    
    if (index >= 0 && index < lignes.length) {
      const line = lignes[index];
      const stockDisponible = line.stockDisponible || 0;
      
      // Vérifier que la quantité ne dépasse pas le stock disponible
      if (newQuantity > stockDisponible) {
        alert(`La quantité ne peut pas dépasser le stock disponible (${stockDisponible} unités)`);
        event.target.value = Math.min(newQuantity, stockDisponible);
        return;
      }
      
      // Vérifier que la quantité est au moins égale à 1
      if (newQuantity < 1) {
        alert('La quantité doit être au moins égale à 1');
        event.target.value = 1;
        return;
      }
      
      // Mettre à jour la quantité
      line.quantite = newQuantity;
      
      // Recalculer le sous-total si nécessaire
      if (line.prix) {
        line.sousTotal = line.prix * newQuantity;
      }
      
      this.commandeForm.patchValue({ lignes });
      console.log('Quantité mise à jour pour la ligne', index, ':', newQuantity);
    }
  }

  resetLineForm(): void {
    this.lineForm.reset({
      code: '',
      reference: '',
      description: '',
      quantite: 1,
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
      magasinSourceId: '',
      magasinDestinationId: '',
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

  // Pagination methods
  getPaginatedCommandes(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCommandes.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Méthodes pour les actions des popups
  openDetailsPopup(commande: any): void {
    this.selectedCommande = commande;
    this.detailsPopUp = true;
  }

  openEditPopup(commande: any): void {
    this.editCommande(commande);
  }

  openDeletePopup(commande: any): void {
    this.selectedCommande = commande;
    this.selectdID = commande.idCmd;
    this.deletedPopUp = true;
  }

  // Méthodes utilitaires pour l'affichage
  getMagasinName(magasinId: any): string {
    if (!magasinId) return '';
    // Si c'est déjà un nom (string sans chiffre), retourne directement
    if (typeof magasinId === 'string' && isNaN(Number(magasinId))) return magasinId;
    // Recherche par idMagasin
    const magasin = this.magasins.find((m) => m.idMagasin === magasinId || m.nomMagasin === magasinId);
    return magasin ? magasin.nomMagasin || magasin.nom : magasinId;
  }

  // Méthode pour formater l'affichage des magasins
  formatMagasinDisplay(magasinData: any): string {
    if (!magasinData) return '-';
    if (typeof magasinData === 'string') return magasinData;
    if (typeof magasinData === 'object') {
      return magasinData.nomMagasin || magasinData.nom || '-';
    }
    return '-';
  }

  // Méthode pour obtenir le nom du magasin source sélectionné
  getSelectedMagasinSourceName(): string {
    const magasinSourceId = this.commandeForm.get('magasinSourceId')?.value;
    if (!magasinSourceId) return '';

    const magasin = this.magasins.find((m) => m.idMagasin === magasinSourceId);
    return magasin ? magasin.nomMagasin : '';
  }
}
