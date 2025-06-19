import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommandeService } from 'src/app/core/services/commande.service';
import { PopupComponent } from '../../shared/popup/popup.component';

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
  clients: any[] = [];
  magasins: any[] = [];
  articles: any[] = [];
  articlesWithStock: any[] = [];
  
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

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Math object for template
  Math = Math;

  constructor(
    private fb: FormBuilder, 
    private service: CommandeService
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadData();
  }

  initForms(): void {
    this.commandeForm = this.fb.group({
      libelle: ['', Validators.required],
      dateCommande: [new Date().toISOString().substring(0, 10), Validators.required],
      dateLivraison: ['', Validators.required],
      clientId: ['', Validators.required],
      tauxTva: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      lignes: [[]],
      magasinId: [null, Validators.required]
    });

    this.lineForm = this.fb.group({
      code: ['', Validators.required],
      reference: ['', Validators.required],
      description: ['', Validators.required],
      prixUnitaire: [0, [Validators.required, Validators.min(0)]],
      quantite: [1, [Validators.required, Validators.min(1)]]
    });

    this.factureForm = this.fb.group({
      numFacture: [this.nextFactureNumber, Validators.required],
      dateFacture: [new Date().toISOString().substring(0, 10), Validators.required],
      clientId: ['', Validators.required],
      commandes: [[], Validators.required]
    });
  }

  loadData(): void {
    // Mock data - replace with actual service calls
    this.commandes = [
      {
        idCmd: 1,
        libelle: 'Commande Vente Matériel Informatique',
        dateCommande: '2024-01-15',
        dateLivraison: '2024-01-25',
        client: 'Entreprise ABC',
        magasin: 'Magasin 1',
        tauxTva: 19,
        montantHt: 12000.00,
        montantTva: 2280.00,
        montantTtc: 14280.00,
        lignes: [
          {
            code: 'ART001',
            reference: 'REF001',
            description: 'Ordinateur portable',
            prixUnitaire: 1200.00,
            quantite: 8,
            sousTotal: 9600.00
          },
          {
            code: 'ART002',
            reference: 'REF002',
            description: 'Écran 24"',
            prixUnitaire: 300.00,
            quantite: 8,
            sousTotal: 2400.00
          }
        ]
      },
      {
        idCmd: 2,
        libelle: 'Commande Vente Mobilier Bureau',
        dateCommande: '2024-01-10',
        dateLivraison: '2024-01-20',
        client: 'Société XYZ',
        magasin: 'Magasin 2',
        tauxTva: 7,
        montantHt: 8500.00,
        montantTva: 595.00,
        montantTtc: 9095.00,
        lignes: [
          {
            code: 'ART003',
            reference: 'REF003',
            description: 'Bureau ergonomique',
            prixUnitaire: 450.00,
            quantite: 15,
            sousTotal: 6750.00
          },
          {
            code: 'ART004',
            reference: 'REF004',
            description: 'Chaise de bureau',
            prixUnitaire: 175.00,
            quantite: 10,
            sousTotal: 1750.00
          }
        ]
      },
      {
        idCmd: 3,
        libelle: 'Commande Vente Accessoires',
        dateCommande: '2024-01-12',
        dateLivraison: '2024-01-22',
        client: 'Entreprise ABC',
        magasin: 'Magasin 1',
        tauxTva: 19,
        montantHt: 3500.00,
        montantTva: 665.00,
        montantTtc: 4165.00,
        lignes: [
          {
            code: 'ART005',
            reference: 'REF005',
            description: 'Imprimante laser',
            prixUnitaire: 350.00,
            quantite: 10,
            sousTotal: 3500.00
          }
        ]
      },
      {
        idCmd: 4,
        libelle: 'Commande Vente Équipements',
        dateCommande: '2024-01-18',
        dateLivraison: '2024-01-28',
        client: 'Entreprise ABC',
        magasin: 'Magasin 3',
        tauxTva: 19,
        montantHt: 2800.00,
        montantTva: 532.00,
        montantTtc: 3332.00,
        lignes: [
          {
            code: 'ART006',
            reference: 'REF006',
            description: 'Scanner document',
            prixUnitaire: 280.00,
            quantite: 10,
            sousTotal: 2800.00
          }
        ]
      }
    ];

    // Initialiser le total des commandes
    this.totalItems = this.commandes.length;
    
    // Initialiser les commandes filtrées
    this.filteredCommandes = [...this.commandes];

    this.clients = [
      { idClient: 1, nom: 'Entreprise ABC', tauxTva: 19 },
      { idClient: 2, nom: 'Société XYZ', tauxTva: 7 },
      { idClient: 3, nom: 'Startup Innov', tauxTva: 19 },
      { idClient: 4, nom: 'PME Tech', tauxTva: 7 },
      { idClient: 5, nom: 'Corporation Plus', tauxTva: 19 }
    ];

    this.magasins = [
      { idMagasin: 1, nom: 'Magasin 1' },
      { idMagasin: 2, nom: 'Magasin 2' },
      { idMagasin: 3, nom: 'Magasin 3' },
      { idMagasin: 4, nom: 'Magasin 4' },
      { idMagasin: 5, nom: 'Magasin 5' }
    ];

    this.articles = [
      { idArticle: 1, code: 'ART001', reference: 'REF001', description: 'Ordinateur portable', prix: 1200.00 }, // prix de vente
      { idArticle: 2, code: 'ART002', reference: 'REF002', description: 'Écran 24"', prix: 300.00 }, // prix de vente
      { idArticle: 3, code: 'ART003', reference: 'REF003', description: 'Bureau ergonomique', prix: 450.00 }, // prix de vente
      { idArticle: 4, code: 'ART004', reference: 'REF004', description: 'Chaise de bureau', prix: 175.00 }, // prix de vente
      { idArticle: 5, code: 'ART005', reference: 'REF005', description: 'Imprimante laser', prix: 350.00 }, // prix de vente
      { idArticle: 6, code: 'ART006', reference: 'REF006', description: 'Scanner document', prix: 280.00 } // prix de vente
    ];

    // Articles avec stock (prix de vente) - stocks par magasin
    this.articlesWithStock = [
      { 
        idArticle: 1, 
        code: 'ART001', 
        reference: 'REF001', 
        description: 'Ordinateur portable',
        prix: 1200.00, // prix de vente
        stocks: {
          1: 25, // Magasin 1
          2: 15, // Magasin 2
          3: 8,  // Magasin 3
          4: 12, // Magasin 4
          5: 20  // Magasin 5
        }
      },
      { 
        idArticle: 2, 
        code: 'ART002', 
        reference: 'REF002', 
        description: 'Écran 24"',
        prix: 300.00, // prix de vente
        stocks: {
          1: 40, // Magasin 1
          2: 25, // Magasin 2
          3: 15, // Magasin 3
          4: 30, // Magasin 4
          5: 18  // Magasin 5
        }
      },
      { 
        idArticle: 3, 
        code: 'ART003', 
        reference: 'REF003', 
        description: 'Bureau ergonomique',
        prix: 450.00, // prix de vente
        stocks: {
          1: 15, // Magasin 1
          2: 8,  // Magasin 2
          3: 12, // Magasin 3
          4: 6,  // Magasin 4
          5: 10  // Magasin 5
        }
      },
      { 
        idArticle: 4, 
        code: 'ART004', 
        reference: 'REF004', 
        description: 'Chaise de bureau',
        prix: 175.00, // prix de vente
        stocks: {
          1: 30, // Magasin 1
          2: 20, // Magasin 2
          3: 15, // Magasin 3
          4: 25, // Magasin 4
          5: 12  // Magasin 5
        }
      },
      { 
        idArticle: 5, 
        code: 'ART005', 
        reference: 'REF005', 
        description: 'Imprimante laser',
        prix: 350.00, // prix de vente
        stocks: {
          1: 8,  // Magasin 1
          2: 12, // Magasin 2
          3: 6,  // Magasin 3
          4: 10, // Magasin 4
          5: 15  // Magasin 5
        }
      },
      { 
        idArticle: 6, 
        code: 'ART006', 
        reference: 'REF006', 
        description: 'Scanner document',
        prix: 280.00, // prix de vente
        stocks: {
          1: 12, // Magasin 1
          2: 8,  // Magasin 2
          3: 5,  // Magasin 3
          4: 15, // Magasin 4
          5: 9   // Magasin 5
        }
      }
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
    this.articleSelectionPopUp = true;
    this.articleSearchFilter = '';
    this.selectedArticles = [];
    // Set selected magasin from form if available
    const magasinId = this.commandeForm.get('magasinId')?.value;
    this.selectedMagasin = magasinId || null;
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
        this.commandeForm.patchValue({ tauxTva: client.tauxTva });
      }
    }
  }

  // Commande management
  saveCommande(): void {
    if (this.commandeForm.valid) {
      const formData = this.commandeForm.value;
      
      if (this.isEditing) {
        // Update existing commande
        const index = this.commandes.findIndex(c => c.idCmd === this.selectdID);
        if (index !== -1) {
          const client = this.clients.find(c => c.idClient === formData.clientId);
          
          this.commandes[index] = {
            ...this.commandes[index],
            ...formData,
            client: client?.nom,
            montantHt: this.calculateMontantHt(),
            montantTva: this.calculateMontantTva(),
            montantTtc: this.calculateMontantTtc()
          };
        }
      } else {
        // Add new commande
        const client = this.clients.find(c => c.idClient === formData.clientId);
        
        const newCommande = {
          ...formData,
          idCmd: Math.max(...this.commandes.map(c => c.idCmd), 0) + 1,
          client: client?.nom,
          montantHt: this.calculateMontantHt(),
          montantTva: this.calculateMontantTva(),
          montantTtc: this.calculateMontantTtc()
        };
        
        this.commandes.push(newCommande);
      }
      
      this.closeModal();
    }
  }

  editCommande(commande: any): void {
    this.selectdID = commande.idCmd;
    this.selectedCommande = commande;
    this.isEditing = true;
    
    this.commandeForm.patchValue({
      libelle: commande.libelle,
      dateCommande: commande.dateCommande,
      dateLivraison: commande.dateLivraison,
      clientId: this.clients.find(c => c.nom === commande.client)?.idClient,
      tauxTva: commande.tauxTva,
      lignes: commande.lignes || [],
      magasinId: this.magasins.find(m => m.nom === commande.magasin)?.idMagasin
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
    const tauxTva = this.commandeForm.get('tauxTva')?.value || 0;
    const montantTva = montantHt * (tauxTva / 100);
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
    const montantHt = this.calculateMontantHt();
    const tauxTva = this.commandeForm.get('tauxTva')?.value || 0;
    return montantHt * (tauxTva / 100);
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
      quantite: 1
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
      tauxTva: 19,
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
    const currentPageCommandes = this.getPaginatedCommandes();
    return currentPageCommandes.length > 0 && 
           currentPageCommandes.every(c => this.isCommandeSelected(c));
  }

  openFactureForm(): void {
    if (this.selectedCommandes.length === 0) {
      alert('Veuillez sélectionner au moins une commande pour créer une facture.');
      return;
    }

    // Vérifier que toutes les commandes ont le même client
    const clients = [...new Set(this.selectedCommandes.map(c => c.client))];
    if (clients.length > 1) {
      alert('Impossible de créer une facture avec des commandes de clients différents. Toutes les commandes doivent être du même client.');
      return;
    }

    const client = this.clients.find(c => c.nom === clients[0]);
    
    // Générer automatiquement le numéro de facture
    this.updateFactureNumber();
    
    this.factureForm.patchValue({
      clientId: client?.idClient,
      commandes: this.selectedCommandes,
      numFacture: this.nextFactureNumber,
      dateFacture: new Date().toISOString().substring(0, 10)
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
}
