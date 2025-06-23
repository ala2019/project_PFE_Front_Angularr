import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommandeService } from 'src/app/core/services/commande.service';
import { PopupComponent } from '../../shared/popup/popup.component';

@Component({
  selector: 'app-cmdtransfert',
  templateUrl: './cmdtransfert.component.html',
  styleUrls: ['./cmdtransfert.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PopupComponent],
  standalone: true
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
  magasins: any[] = [];
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
    dateFin: ''
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
      magasinSourceId: ['', Validators.required],
      magasinDestinationId: ['', Validators.required],
      lignes: [[]]
    });

    this.lineForm = this.fb.group({
      code: ['', Validators.required],
      reference: ['', Validators.required],
      description: ['', Validators.required],
      quantite: [1, [Validators.required, Validators.min(1)]]
    });
  }

  loadData(): void {
    // Mock data - replace with actual service calls
    this.commandes = [
      {
        idCmd: 1,
        libelle: 'Cmd-TRS-2025/00001',
        dateCommande: '2024-01-15',
        magasinSource: 'Magasin moknine',
        magasinDestination: 'Magasin ksar hellal',
        lignes: [
          {
            code: 'ART001',
            reference: 'REF001',
            description: 'Ordinateur portable',
            quantite: 5,
            prixUnitaire: 1200,
            montantLigne: 6000
          }
        ],
        montantTotal: 6000
      },
      {
        idCmd: 2,
        libelle: 'Cmd-TRS-2025/00002',
        dateCommande: '2024-01-16',
        magasinSource: 'Magasin ksar hellal ',
        magasinDestination: 'Magasin moknine',
        lignes: [
          {
            code: 'ART002',
            reference: 'REF002',
            description: 'Souris sans fil',
            quantite: 20,
            prixUnitaire: 25,
            montantLigne: 500
          }
        ],
        montantTotal: 500
      }
    ];
    
    this.filteredCommandes = [...this.commandes];
    this.totalItems = this.commandes.length;

    this.magasins = [
      { idMagasin: 1, nom: 'Magasin Central' },
      { idMagasin: 2, nom: 'Magasin Nord' },
      { idMagasin: 3, nom: 'Magasin Sud' },
      { idMagasin: 4, nom: 'Magasin Est' },
      { idMagasin: 5, nom: 'Magasin Ouest' }
    ];

    this.articles = [
      { idArticle: 1, code: 'ART001', reference: 'REF001', description: 'Ordinateur portable' },
      { idArticle: 2, code: 'ART002', reference: 'REF002', description: 'Écran 24"' },
      { idArticle: 3, code: 'ART003', reference: 'REF003', description: 'Bureau ergonomique' },
      { idArticle: 4, code: 'ART004', reference: 'REF004', description: 'Chaise de bureau' },
      { idArticle: 5, code: 'ART005', reference: 'REF005', description: 'Imprimante laser' },
      { idArticle: 6, code: 'ART006', reference: 'REF006', description: 'Scanner document' }
    ];

    // Articles avec stock par magasin
    this.articlesWithStock = [
      { 
        idArticle: 1, 
        code: 'ART001', 
        reference: 'REF001', 
        description: 'Ordinateur portable',
        stockMagasinCentral: 25,
        stockMagasinNord: 8,
        stockMagasinSud: 15,
        stockMagasinEst: 12,
        stockMagasinOuest: 20
      },
      { 
        idArticle: 2, 
        code: 'ART002', 
        reference: 'REF002', 
        description: 'Écran 24"',
        stockMagasinCentral: 40,
        stockMagasinNord: 12,
        stockMagasinSud: 25,
        stockMagasinEst: 18,
        stockMagasinOuest: 30
      },
      { 
        idArticle: 3, 
        code: 'ART003', 
        reference: 'REF003', 
        description: 'Bureau ergonomique',
        stockMagasinCentral: 15,
        stockMagasinNord: 5,
        stockMagasinSud: 20,
        stockMagasinEst: 8,
        stockMagasinOuest: 12
      },
      { 
        idArticle: 4, 
        code: 'ART004', 
        reference: 'REF004', 
        description: 'Chaise de bureau',
        stockMagasinCentral: 30,
        stockMagasinNord: 10,
        stockMagasinSud: 35,
        stockMagasinEst: 15,
        stockMagasinOuest: 25
      },
      { 
        idArticle: 5, 
        code: 'ART005', 
        reference: 'REF005', 
        description: 'Imprimante laser',
        stockMagasinCentral: 8,
        stockMagasinNord: 3,
        stockMagasinSud: 12,
        stockMagasinEst: 6,
        stockMagasinOuest: 10
      },
      { 
        idArticle: 6, 
        code: 'ART006', 
        reference: 'REF006', 
        description: 'Scanner document',
        stockMagasinCentral: 12,
        stockMagasinNord: 4,
        stockMagasinSud: 8,
        stockMagasinEst: 5,
        stockMagasinOuest: 7
      }
    ];
  }

  // Get stock for selected magasin source
  getStockForMagasin(article: any, magasinSourceId: number): number {
    const magasin = this.magasins.find(m => m.idMagasin === magasinSourceId);
    if (!magasin) return 0;
    
    switch (magasin.nom) {
      case 'Magasin Central': return article.stockMagasinCentral || 0;
      case 'Magasin Nord': return article.stockMagasinNord || 0;
      case 'Magasin Sud': return article.stockMagasinSud || 0;
      case 'Magasin Est': return article.stockMagasinEst || 0;
      case 'Magasin Ouest': return article.stockMagasinOuest || 0;
      default: return 0;
    }
  }

  // Get filtered articles based on search
  getFilteredArticles(): any[] {
    const magasinSourceId = this.commandeForm.get('magasinSourceId')?.value;
    if (!magasinSourceId) return [];

    return this.articlesWithStock
      .filter(article => {
        const searchTerm = this.articleSearchFilter.toLowerCase().trim();
        if (!searchTerm) return true; // Si pas de recherche, afficher tous les articles
        
        // Recherche par code, référence ou description (critère "contient")
        return article.code.toLowerCase().includes(searchTerm) ||
               article.reference.toLowerCase().includes(searchTerm) ||
               article.description.toLowerCase().includes(searchTerm);
      })
      .map(article => ({
        ...article,
        stockDisponible: this.getStockForMagasin(article, magasinSourceId)
      }))
      .filter(article => article.stockDisponible > 0);
  }

  // Open article selection popup
  openArticleSelection(): void {
    const magasinSourceId = this.commandeForm.get('magasinSourceId')?.value;
    if (!magasinSourceId) {
      alert('Veuillez d\'abord sélectionner un magasin source');
      return;
    }
    this.articleSelectionPopUp = true;
    this.articleSearchFilter = '';
    this.selectedArticles = [];
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
        quantite: 1
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
    // Implement filter logic here
    console.log('Applying filters:', this.filters);
  }

  clearFilters(): void {
    this.filters = {
      libelle: '',
      magasinSource: '',
      magasinDestination: '',
      dateDebut: '',
      dateFin: ''
    };
  }

  // Commande management
  saveCommande(): void {
    if (this.commandeForm.valid) {
      const formData = this.commandeForm.value;
      
      if (this.isEditing) {
        // Update existing commande
        const index = this.commandes.findIndex(c => c.idCmd === this.selectdID);
        if (index !== -1) {
          const magasinSource = this.magasins.find(m => m.idMagasin === formData.magasinSourceId);
          const magasinDestination = this.magasins.find(m => m.idMagasin === formData.magasinDestinationId);
          
          this.commandes[index] = {
            ...this.commandes[index],
            ...formData,
            magasinSource: magasinSource?.nom,
            magasinDestination: magasinDestination?.nom
          };
        }
      } else {
        // Add new commande
        const magasinSource = this.magasins.find(m => m.idMagasin === formData.magasinSourceId);
        const magasinDestination = this.magasins.find(m => m.idMagasin === formData.magasinDestinationId);
        
        const newCommande = {
          ...formData,
          idCmd: Math.max(...this.commandes.map(c => c.idCmd), 0) + 1,
          magasinSource: magasinSource?.nom,
          magasinDestination: magasinDestination?.nom
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
      magasinSourceId: this.magasins.find(m => m.nom === commande.magasinSource)?.idMagasin,
      magasinDestinationId: this.magasins.find(m => m.nom === commande.magasinDestination)?.idMagasin,
      lignes: commande.lignes || []
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
      
      const newLine = {
        ...lineData
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
        ...lineData
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

  resetLineForm(): void {
    this.lineForm.reset({
      code: '',
      reference: '',
      description: '',
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
      lignes: []
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

  openDetailsPopup(commande: any): void {
    this.selectedCommande = commande;
    this.detailsPopUp = true;
  }

  openEditPopup(commande: any): void {
    this.selectedCommande = commande;
    this.selectdID = commande.idCmd;
    this.isEditing = true;
    this.createPopUp = true;
  }

  openDeletePopup(commande: any): void {
    this.selectedCommande = commande;
    this.selectdID = commande.idCmd;
    this.deletedPopUp = true;
  }
}
