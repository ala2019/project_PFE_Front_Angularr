import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommandeService } from 'src/app/core/services/commande.service';
import { PopupComponent } from '../../shared/popup/popup.component';
import { FournisseurClientService } from 'src/app/core/services/fourisseur-client.service';
import { MagasinService } from 'src/app/core/services/magasin.service';

@Component({
  selector: 'app-cmdvente',
  templateUrl: './cmdvente.component.html',
  styleUrls: ['./cmdvente.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PopupComponent],
  standalone: true
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
    dateFin: ''
  };

  // Article search filter
  articleSearchFilter = '';
  selectedArticles: any[] = [];
  selectedMagasin: number | null = null;

  // Facture printing
  selectedCommandes: any[] = [];
  showFactureForm = false;
  nextFactureNumber = 'FACT-2024-001';
  factureCounter = 1;
  expandedCommandes = new Set<number>();

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
    private magasinService: MagasinService
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadCommandes();
  }

  initForms(): void {
    this.commandeForm = this.fb.group({
      libelle: ['', Validators.required],
      dateCommande: [new Date().toISOString().substring(0, 10), Validators.required],
      clientId: ['', Validators.required],
      modePaiement: ['', Validators.required],
      lignes: [[]],
      magasinId: [null, Validators.required]
    });

    this.lineForm = this.fb.group({
      code: ['', Validators.required],
      reference: ['', Validators.required],
      description: ['', Validators.required],
      prixUnitaire: [0, [Validators.required, Validators.min(0)]],
      quantite: [1, [Validators.required, Validators.min(1)]],
      tauxTva: [19, [Validators.required, Validators.min(0), Validators.max(100)]]
    });

    this.factureForm = this.fb.group({
      numFacture: [this.nextFactureNumber, Validators.required],
      dateFacture: [new Date().toISOString().substring(0, 10), Validators.required],
      clientId: ['', Validators.required],
      commandes: [[], Validators.required]
    });
  }

  loadCommandes(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        data = (data || []).filter((commande: any) => commande.type === 'VENTE');
        this.allCommandes = data;
        this.commandes = data;
        this.filteredCommandes = [...data];
        this.totalItems = data.length;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des commandes de vente:', error);
      },
    });
    // Charger dynamiquement les clients
    this.fournisseurClientService.getAll().subscribe((data: any[]) => {
      this.clients = (data || []).filter((p: any) => p.type === 'CLIENT');
    });
    // Charger dynamiquement les magasins
    this.magasinService.getAll().subscribe((data: any[]) => {
      this.magasins = data || [];
    });

    this.articles = [
      
    ];

    // Articles avec stock (prix de vente) - stocks par magasin
    this.articlesWithStock = [
      
    ];

    this.modesPaiement = [
      { idModePaiement: 1, nom: 'Espèces' },
      { idModePaiement: 2, nom: 'Chèque' },
      { idModePaiement: 3, nom: 'Virement' },
      { idModePaiement: 4, nom: 'Carte bancaire' }
    ];
  }

  // Filter methods
  applyFilters(): void {
    this.filteredCommandes = this.commandes.filter(commande => {
      // Filtre par libellé
      if (this.filters.libelle && !commande.libelle.toLowerCase().includes(this.filters.libelle.toLowerCase())) {
        return false;
      }
      
      // Filtre par client
      if (this.filters.client && commande.client !== this.filters.client) {
        return false;
      }
      
      // Filtre par magasin
      if (this.filters.magasin && commande.magasin !== this.filters.magasin) {
        return false;
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
      client: '',
      magasin: '',
      dateDebut: '',
      dateFin: ''
    };
    
    // Réinitialiser les commandes filtrées
    this.filteredCommandes = [...this.commandes];
    this.totalItems = this.filteredCommandes.length;
    this.currentPage = 1;
  }

  // Get filtered articles based on search
  getFilteredArticles(): any[] {
    return this.articlesWithStock
      .filter(article => {
        const searchTerm = this.articleSearchFilter.toLowerCase().trim();
        if (!searchTerm) return true;
        
        return article.code.toLowerCase().includes(searchTerm) ||
               article.reference.toLowerCase().includes(searchTerm) ||
               article.description.toLowerCase().includes(searchTerm);
      })
      .filter(article => this.getArticleStock(article) > 0);
  }

  // Get stock for selected magasin
  getArticleStock(article: any): number {
    if (!this.selectedMagasin) return 0;
    return article.stocks[this.selectedMagasin] || 0;
  }

  // Get stock for article by code
  getArticleStockByCode(code: string): number {
    if (!this.selectedMagasin) return 0;
    const article = this.articlesWithStock.find(a => a.code === code);
    return article ? (article.stocks[this.selectedMagasin] || 0) : 0;
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
      const stock = this.getArticleStockByCode(line.code);
      
      // Vérifier que la quantité ne dépasse pas le stock
      if (newQuantity > stock) {
        alert(`La quantité ne peut pas dépasser le stock disponible (${stock} unités)`);
        event.target.value = Math.min(newQuantity, stock);
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
    if (stock > 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  // Get selected magasin name
  getSelectedMagasinName(): string {
    if (!this.selectedMagasin) return '';
    const magasin = this.magasins.find(m => m.idMagasin === this.selectedMagasin);
    return magasin ? magasin.nom : '';
  }

  // Get facture client name
  getFactureClientName(): string {
    const clientId = this.factureForm?.get('clientId')?.value;
    if (!clientId) return '';
    const client = this.clients.find(c => c.idClient === clientId);
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
      alert('Veuillez d\'abord sélectionner un magasin avant d\'ajouter des articles.');
      return;
    }
    
    this.articleSelectionPopUp = true;
    this.articleSearchFilter = '';
    this.selectedArticles = [];
    this.selectedMagasin = magasinId;
  }

  // Toggle article selection
  toggleArticleSelection(article: any): void {
    const index = this.selectedArticles.findIndex(a => a.idArticle === article.idArticle);
    if (index > -1) {
      this.selectedArticles.splice(index, 1);
    } else {
      this.selectedArticles.push(article);
    }
  }

  // Check if article is selected
  isArticleSelected(article: any): boolean {
    return this.selectedArticles.some(a => a.idArticle === article.idArticle);
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
    this.selectedArticles.forEach(article => {
      const newLine = {
        code: article.code,
        reference: article.reference,
        description: article.description,
        prixUnitaire: article.prix,
        quantite: 1,
        tauxTva: 19, // Taux TVA par défaut, peut être modifié par ligne
        sousTotal: article.prix
      };
      
      const lignes = this.commandeForm.get('lignes')?.value || [];
      lignes.push(newLine);
      this.commandeForm.patchValue({ lignes });
    });
    
    this.closeArticleSelection();
    this.updateTotals();
  }

  // Close article selection popup
  closeArticleSelection(): void {
    this.articleSelectionPopUp = false;
    this.articleSearchFilter = '';
    this.selectedArticles = [];
  }

  // Update client TVA rate when client changes
  onClientChange(): void {
    const clientId = this.commandeForm.get('clientId')?.value;
    if (clientId) {
      const client = this.clients.find(c => c.idClient === clientId);
      if (client) {
        // Mettre à jour le taux TVA par défaut pour les nouvelles lignes
        this.lineForm.patchValue({ tauxTva: client.tauxTva });
      }
    }
  }

  // Commande management
  saveCommande(): void {
    if (this.commandeForm.valid) {
      const formData = this.commandeForm.value;
      
      if (this.isEditing) {
        // Update existing commande locally only
        const index = this.commandes.findIndex(c => c.idCmd === this.selectdID);
        if (index !== -1) {
          const client = this.clients.find(c => c.idClient === formData.clientId);
          
          this.commandes[index] = {
            ...this.commandes[index],
            ...formData,
            type: 'vente', // Set type to 'vente' for update
            client: client?.nom,
            montantHt: this.calculateMontantHt(),
            montantTva: this.calculateMontantTva(),
            montantTtc: this.calculateMontantTtc()
          };
        }
      } else {
        // Add new commande via API
        const client = this.clients.find(c => c.idClient === formData.clientId);
        
        const newCommande = {
          ...formData,
          type: 'vente', // Set type to 'vente' for new
          client: client?.nom,
          montantHt: this.calculateMontantHt(),
          montantTva: this.calculateMontantTva(),
          montantTtc: this.calculateMontantTtc()
        };
        
        this.service.create(newCommande).subscribe({
          next: (createdCommande) => {
            // Optionally, you can push createdCommande or newCommande
            this.commandes.push(createdCommande);
            this.filteredCommandes = [...this.commandes];
            this.totalItems = this.filteredCommandes.length;
            this.closeModal();
          },
          error: (err) => {
            alert('Erreur lors de la création de la commande');
          }
        });
        return; // Prevent closing modal immediately
      }
      
      this.closeModal();
    }
  }

  editCommande(commande: any): void {
    this.selectdID = commande.idCmd;
    this.selectedCommande = commande;
    this.isEditing = true;

    // Normaliser les lignes pour garantir la présence de 'reference'
    let lignes = commande.lignes || commande.detailCmds || [];
    lignes = lignes.map((l: any) => ({
      ...l,
      code: l.code || l.article?.code || '',
      reference: l.reference || l.ref || l.article?.reference || '',
      description: l.description || l.article?.description || '',
      prixUnitaire: l.prixUnitaire || l.prix || l.article?.prix ||'',
      tauxTva: l.tauxTva || l.tva || l.article?.tva || '',
    }));

    this.commandeForm.patchValue({
      libelle: commande.libelle || commande.libCmd,
      dateCommande: commande.dateCommande || (commande.dateCmd ? new Date(commande.dateCmd).toISOString().substring(0, 10) : ''),
      clientId: commande?.personne?.nomPersonne || '',
      modePaiement: commande?.modePaiement || '',
      lignes,
      magasinId: commande?.magasin?.nomMagasin || '',
      
    });
    this.createPopUp = true;
  }

  deleteCommande(id: number): void {
    this.commandes = this.commandes.filter(c => c.idCmd !== id);
    this.selectdID = null;
    this.selectedCommande = null;
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
        sousTotal: sousTotal
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
        sousTotal: sousTotal
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
      return sum + (line.sousTotal * (tauxTva / 100));
    }, 0);
    const montantTtc = montantHt + montantTva;
    
    // Update form values for display
    this.commandeForm.patchValue({
      montantHt: montantHt,
      montantTva: montantTva,
      montantTtc: montantTtc
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
      return sum + (line.sousTotal * (tauxTva / 100));
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
      prix: '',
      quantite: '',
      tauxTva: ''
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
      magasinId: null
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
    const index = this.selectedCommandes.findIndex(c => c.idCmd === commande.idCmd);
    if (index > -1) {
      this.selectedCommandes.splice(index, 1);
    } else {
      this.selectedCommandes.push(commande);
    }
  }

  isCommandeSelected(commande: any): boolean {
    return this.selectedCommandes.some(c => c.idCmd === commande.idCmd);
  }

  toggleSelectAllCommandes(): void {
    const currentPageCommandes = this.getPaginatedCommandes();
    const selectedOnCurrentPage = currentPageCommandes.filter(c => this.isCommandeSelected(c));
    
    if (selectedOnCurrentPage.length === currentPageCommandes.length) {
      // Désélectionner toutes les commandes de la page courante
      currentPageCommandes.forEach(commande => {
        const index = this.selectedCommandes.findIndex(c => c.idCmd === commande.idCmd);
        if (index > -1) {
          this.selectedCommandes.splice(index, 1);
        }
      });
    } else {
      // Sélectionner toutes les commandes de la page courante
      currentPageCommandes.forEach(commande => {
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
      // Afficher une alerte ou un toast pour notifier l'utilisateur
      alert("Veuillez sélectionner au moins une commande pour générer une facture.");
      return;
    }
    
    // Vérifier que toutes les commandes sélectionnées appartiennent au même client
    const firstClientId = this.selectedCommandes[0]?.clientId;
    const allSameClient = this.selectedCommandes.every(cmd => cmd.clientId === firstClientId);
    
    if (!allSameClient) {
      alert("Toutes les commandes sélectionnées doivent appartenir au même client.");
      return;
    }

    this.updateFactureNumber();
    this.factureForm.patchValue({
      numFacture: this.nextFactureNumber,
      dateFacture: new Date().toISOString().substring(0, 10),
      clientId: firstClientId, // Set the client ID here
      commandes: this.selectedCommandes.map(cmd => cmd.idCmd)
    });

    this.showFactureForm = true;
  }

  closeFactureForm(): void {
    this.showFactureForm = false;
    this.selectedCommandes = [];
  }

  calculateFactureTotal(): number {
    return this.selectedCommandes.reduce((total, commande) => total + commande.montantTtc, 0);
  }

  calculateFactureTotalHt(): number {
    return this.selectedCommandes.reduce((total, commande) => total + commande.montantHt, 0);
  }

  calculateFactureTotalTva(): number {
    return this.selectedCommandes.reduce((total, commande) => total + commande.montantTva, 0);
  }

  printFacture(): void {
    if (this.factureForm.valid) {
      const factureData = {
        ...this.factureForm.value,
        totalHt: this.calculateFactureTotalHt(),
        totalTva: this.calculateFactureTotalTva(),
        totalTtc: this.calculateFactureTotal(),
        client: this.clients.find(c => c.idClient === this.factureForm.value.clientId)?.nom,
        commandes: this.selectedCommandes
      };

      // Générer le contenu HTML de la facture
      const factureHtml = this.generateFactureHtml(factureData);
      
      // Ouvrir la fenêtre d'impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(factureHtml);
        printWindow.document.close();
        printWindow.print();
      }

      // Incrémenter le compteur de factures pour la prochaine facture
      this.factureCounter++;

      this.closeFactureForm();
    }
  }

  generateFactureHtml(factureData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture ${factureData.numFacture}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .facture-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .client-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .totals { text-align: right; margin-top: 20px; }
          .total-line { margin: 5px 0; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FACTURE</h1>
          <h2>${factureData.numFacture}</h2>
        </div>

        <div class="facture-info">
          <div>
            <strong>Date de facture:</strong> ${new Date(factureData.dateFacture).toLocaleDateString('fr-FR')}
          </div>
          <div>
            <strong>Client:</strong> ${factureData.client}
          </div>
        </div>

        <div class="client-info">
          <strong>Adresse de facturation:</strong><br>
          ${factureData.client}<br>
          <!-- Adresse complète du client -->
        </div>

        <table>
          <thead>
            <tr>
              <th>Commande</th>
              <th>Date</th>
              <th>Libellé</th>
              <th>Montant HT</th>
              <th>TVA</th>
              <th>Montant TTC</th>
            </tr>
          </thead>
          <tbody>
            ${factureData.commandes.map((commande: any) => `
              <tr>
                <td>CMD-${commande.idCmd}</td>
                <td>${new Date(commande.dateCommande).toLocaleDateString('fr-FR')}</td>
                <td>${commande.libelle}</td>
                <td>${commande.montantHt.toFixed(2)} €</td>
                <td>${commande.montantTva.toFixed(2)} €</td>
                <td>${commande.montantTtc.toFixed(2)} €</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-line">
            <strong>Total HT:</strong> ${factureData.totalHt.toFixed(2)} €
          </div>
          <div class="total-line">
            <strong>Total TVA:</strong> ${factureData.totalTva.toFixed(2)} €
          </div>
          <div class="total-line">
            <strong>Total TTC:</strong> ${factureData.totalTtc.toFixed(2)} €
          </div>
        </div>

        <div class="footer">
          <p>Merci pour votre confiance</p>
          <p>Cette facture est générée automatiquement</p>
        </div>
      </body>
      </html>
    `;
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
    const client = this.clients.find(c => c.idPersonne === clientId || c.idClient === clientId);
    return client ? (client.nomPersonne || client.nom) : clientId;
  }

  getMagasinName(magasinId: any): string {
    if (!magasinId) return '';
    // Si c'est déjà un nom (string sans chiffre), retourne directement
    if (typeof magasinId === 'string' && isNaN(Number(magasinId))) return magasinId;
    // Recherche par idMagasin
    const magasin = this.magasins.find(m => m.idMagasin === magasinId || m.nomMagasin === magasinId);
    return magasin ? (magasin.nomMagasin || magasin.nom) : magasinId;
  }

  getClientDevise(clientId: any): string {
    if (!clientId) return '';
    // Recherche par idPersonne ou idClient
    const client = this.clients.find(c => c.idPersonne === clientId || c.idClient === clientId);
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
    const client = this.clients.find(c => c.idPersonne == clientId || c.idClient == clientId);
    if (client && client.devise) {
      if (typeof client.devise === 'object' && client.devise !== null) {
        return client.devise.code || client.devise.nom || client.devise.libelle || 'N/A';
      }
      return client.devise;
    }
    return 'N/A';
  }
}
