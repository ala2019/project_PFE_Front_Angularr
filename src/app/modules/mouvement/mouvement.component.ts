import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TableRowComponent } from '../uikit/pages/table/components/table-row/table-row.component';
import { TableFooterComponent } from '../uikit/pages/table/components/table-footer/table-footer.component';
import { TableHeaderComponent } from '../uikit/pages/table/components/table-header/table-header.component';
import { PopupComponent } from '../shared/popup/popup.component';
import { MouvementService } from '../../core/services/mouvement.service';
import { MagasinService } from '../../core/services/magasin.service';
import { ArticleService } from '../../core/services/article.service';
import { Mouvement, MouvementLigne, MouvementFilter } from '../../core/models/mouvement.model';
import { CommandeService } from 'src/app/core/services/commande.service';

@Component({
  selector: 'app-mouvement',
  templateUrl: 'mouvement.component.html',
  styleUrl: 'mouvement.component.scss',
  imports: [CommonModule, AngularSvgIconModule, PopupComponent, ReactiveFormsModule, FormsModule],
  standalone: true,
})
export class MouvementComponent implements OnInit {
  // Popup management
  createPopUp = false;
  detailsPopUp = false;
  deletePopUp = false;
  articleSelectionPopUp = false;

  // Selection tracking
  selectedId: number | null = null;
  selectedMouvement: any | null = null;

  // Data arrays
  mouvements: any[] = [];
  filteredMouvements: any[] = [];
  magasins: any[] = [];
  articles: any[] = [];
  articlesWithStock: any[] = [];

  // Forms
  mouvementForm!: FormGroup;
  ligneForm!: FormGroup;
  filterForm!: FormGroup;

  // State management
  isEditing = false;
  showLigneForm = false;
  currentLigneIndex: number | null = null;
  selectedTypeMouvement: 'POINTAGE' | 'TRANSFERT' | 'SORTIE' = 'POINTAGE';

  // Filters
  filters: MouvementFilter = {};

  // Article search filter
  articleSearchFilter = '';
  selectedArticles: any[] = [];
  selectedMagasin: number | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  totalItems = 0;

  // Math object for template
  Math = Math;

  // Type options
  typeOptions = [
    { value: '+', label: 'Entrées' },
    { value: '-', label: 'Sorties' },
  ];

  statutOptions = [
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'TERMINE', label: 'Terminé' },
    { value: 'ANNULE', label: 'Annulé' },
  ];

  constructor(
    private fb: FormBuilder,
    private mouvementService: MouvementService,
    private magasinService: MagasinService,
    private articleService: ArticleService,
    private commandeService: CommandeService,
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadData();
  }

  initForms(): void {
    this.mouvementForm = this.fb.group({
      libelle: ['', Validators.required],
      commandeLibelle: ['', Validators.required],
      typeMouvement: ['POINTAGE', Validators.required],
      dateMouvement: [new Date().toISOString().substring(0, 10), Validators.required],
      magasinSourceId: [null, Validators.required],
      magasinDestinationId: [null],
      observations: [''],
      lignes: [[]],
    });

    this.ligneForm = this.fb.group({
      articleId: ['', Validators.required],
      quantite: [1, [Validators.required, Validators.min(1)]],
    });

    this.filterForm = this.fb.group({
      dateDebut: [''],
      dateFin: [''],
      libelle: [''],
      typeMouvement: [[]],
      magasinSource: [''],
      typeCommande: [''],
    });
  }

  loadData(): void {
    // Charger les mouvements
    this.mouvementService.getAll().subscribe({
      next: (data) => {
        console.log('Données brutes reçues:', data);
        
        // Trier les mouvements par date de mouvement (du plus récent au plus ancien)
        data.sort((a: any, b: any) => {
          const dateA = new Date(a.dateMvt || a.dateMouvement);
          const dateB = new Date(b.dateMvt || b.dateMouvement);
          return dateB.getTime() - dateA.getTime();
        });
        
        this.mouvements = data;
        this.filteredMouvements = [...this.mouvements];
        this.totalItems = this.mouvements.length;
        console.log('Mouvements triés par date:', data);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des mouvements:', error);
        // Données de test
        this.loadMockData();
      },
    });

    // Charger les magasins
    this.magasinService.getAll().subscribe({
      next: (data) => {
        this.magasins = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des magasins:', error);
      },
    });

    // Charger les articles
    this.articleService.getArticles().subscribe({
      next: (data: any[]) => {
        this.articles = data;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des articles:', error);
      },
    });
  }

  loadMockData(): void {
    this.mouvementService.getAll().subscribe({
      next: (value: any) => {
        console.log(value);
        this.mouvements = value;
        this.filteredMouvements = [...this.mouvements];
        this.totalItems = this.filteredMouvements.length;
      },
      error: (err) => {
        // Optionally handle error here
      },
    });
  }

  // Filter methods
  applyFilters(): void {
    const filterValues = this.filterForm.value;
    this.filters = {
      libelle: filterValues.libelle || undefined,
      typeMouvement:
        filterValues.typeMouvement && filterValues.typeMouvement.length ? filterValues.typeMouvement : undefined,
      dateDebut: filterValues.dateDebut || undefined,
      dateFin: filterValues.dateFin || undefined,
      magasinSource: filterValues.magasinSource || undefined,
      typeCommande: filterValues.typeCommande || undefined,
    };

    this.filteredMouvements = this.mouvements.filter((mouvement) => {
      let match = true;

      // Filtre par libellé commande (corrigé pour chercher dans libCmd)
      if (this.filters.libelle) {
        const libelleMatch = mouvement.libCmd?.toLowerCase().includes(this.filters.libelle.toLowerCase()) ||
                            mouvement.libMouvement?.toLowerCase().includes(this.filters.libelle.toLowerCase());
        console.log('Libelle filter check:', {
          mouvementLibCmd: mouvement.libCmd,
          mouvementLibMouvement: mouvement.libMouvement,
          filterLibelle: this.filters.libelle,
          isMatch: libelleMatch
        });
        if (!libelleMatch) {
          match = false;
        }
      }

      if (
        this.filters.typeMouvement &&
        Array.isArray(this.filters.typeMouvement) &&
        this.filters.typeMouvement.length > 0
      ) {
        // Déterminer le type de mouvement (ENTREE ou SORTIE) basé sur le signe
        let mouvementType = 'SORTIE'; // Par défaut
        if (mouvement.signe === '+') {
          mouvementType = 'ENTREE';
        }
        
        console.log('Type filter check:', {
          mouvementSigne: mouvement.signe,
          determinedType: mouvementType,
          filterTypes: this.filters.typeMouvement,
          isMatch: this.filters.typeMouvement.includes(mouvementType)
        });
        
        if (!this.filters.typeMouvement.includes(mouvementType)) {
          match = false;
        }
      }

      // Filtre par date
      if (this.filters.dateDebut || this.filters.dateFin) {
        const mouvementDate = new Date(mouvement.dateMvt || mouvement.dateMouvement);

        if (this.filters.dateDebut) {
          const filterDateDebut = new Date(this.filters.dateDebut);
          const dateDebutMatch = mouvementDate >= filterDateDebut;
          console.log('Date début filter check:', {
            mouvementDate: mouvementDate.toISOString(),
            filterDateDebut: filterDateDebut.toISOString(),
            isMatch: dateDebutMatch
          });
          if (!dateDebutMatch) {
            match = false;
          }
        }

        if (this.filters.dateFin) {
          const filterDateFin = new Date(this.filters.dateFin);
          const dateFinMatch = mouvementDate <= filterDateFin;
          console.log('Date fin filter check:', {
            mouvementDate: mouvementDate.toISOString(),
            filterDateFin: filterDateFin.toISOString(),
            isMatch: dateFinMatch
          });
          if (!dateFinMatch) {
            match = false;
          }
        }
      }

      // Filtre par magasin
      if (this.filters.magasinSource) {
        // Trouver le magasin sélectionné pour obtenir son nom
        const selectedMagasin = this.magasins.find(m => m.idMagasin == this.filters.magasinSource);
        const magasinMatch = mouvement.libMag === selectedMagasin?.nomMagasin;
        console.log('Magasin filter check:', {
          mouvementLibMag: mouvement.libMag,
          selectedMagasinName: selectedMagasin?.nomMagasin,
          filterMagasinId: this.filters.magasinSource,
          isMatch: magasinMatch
        });
        if (!magasinMatch) {
          match = false;
        }
      }

      // Filtre par type de commande
      if (this.filters.typeCommande) {
        const typeCommandeMatch = mouvement.type === this.filters.typeCommande;
        console.log('Type commande filter check:', {
          mouvementType: mouvement.type,
          filterTypeCommande: this.filters.typeCommande,
          isMatch: typeCommandeMatch
        });
        if (!typeCommandeMatch) {
          match = false;
        }
      }

      return match;
    });

    // Appliquer le tri après le filtrage
    this.sortMouvementsByDate();

    // Mettre à jour le total et revenir à la première page
    this.totalItems = this.filteredMouvements.length;
    this.currentPage = 1;

    console.log('Résultat du filtrage des mouvements:', {
      total: this.totalItems,
      filtered: this.filteredMouvements.length,
    });
  }

  clearFilters(): void {
    console.log('Effacement des filtres...');
    this.filterForm.reset();
    this.filters = {};

    // Réinitialiser les checkboxes de type de mouvement
    const checkboxes = document.querySelectorAll('input[type="checkbox"][value="ENTREE"], input[type="checkbox"][value="SORTIE"]') as NodeListOf<HTMLInputElement>;
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    // Réinitialiser le select du magasin
    const magasinSelect = document.querySelector('select[formControlName="magasinSource"]') as HTMLSelectElement;
    if (magasinSelect) {
      magasinSelect.value = '';
    }

    // Restaurer tous les mouvements
    this.filteredMouvements = [...this.mouvements];
    
    // Appliquer le tri après avoir restauré les données
    this.sortMouvementsByDate();
    
    this.totalItems = this.filteredMouvements.length;
    this.currentPage = 1;
    console.log('Filtres effacés, affichage de tous les mouvements:', this.filteredMouvements.length);
  }

  // Pagination methods
  get paginatedMouvements(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredMouvements.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // CRUD methods
  openCreatePopup(): void {
    this.isEditing = false;
    this.selectedMouvement = null;
    this.mouvementForm.reset({
      typeMouvement: 'POINTAGE',
      dateMouvement: new Date().toISOString().substring(0, 10),
      lignes: [],
    });
    this.createPopUp = true;
  }

  openEditPopup(mouvement: any): void {
    this.isEditing = true;
    this.selectedMouvement = mouvement;
    this.selectedId = mouvement.idMouvement;
    this.mouvementService.getOneById(this.selectedMouvement.idMouvement).subscribe({
      next: (value: any) => {
        // Le service retourne un tableau, on prend le premier élément
        const mouvementDetails = Array.isArray(value) ? value[0] : value;
        this.selectedMouvement = { 
          ...mouvement, // Garder les données de la liste
          ...mouvementDetails // Ajouter les détails du service
        };
        console.log('Détails du mouvement pour édition:', this.selectedMouvement);
        
        // Trouver l'ID du magasin basé sur le nom du magasin
        const magasinId = this.magasins.find(m => m.nomMagasin === this.selectedMouvement.libMag)?.idMagasin;
        
        this.mouvementForm.patchValue({
          libelle: this.selectedMouvement.libMouvement,
          commandeLibelle: this.selectedMouvement.libCmd,
          typeMouvement: this.selectedMouvement.signe,
          dateMouvement: new Date(this.selectedMouvement.dateMvt).toISOString().substring(0, 10),
          magasinSourceId: magasinId,
          lignes: this.selectedMouvement.detailMvts || [],
        });
        this.createPopUp = true;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des détails pour édition:', err);
        // En cas d'erreur, utiliser les données de base
        const magasinId = this.magasins.find(m => m.nomMagasin === mouvement.libMag)?.idMagasin;
        
        this.mouvementForm.patchValue({
          libelle: mouvement.libMouvement,
          commandeLibelle: mouvement.libCmd,
          typeMouvement: mouvement.signe,
          dateMouvement: new Date(mouvement.dateMvt).toISOString().substring(0, 10),
          magasinSourceId: magasinId,
          lignes: [],
        });
        this.createPopUp = true;
      },
    });
  }

  openDetailsPopup(mouvement: any): void {
    this.selectedMouvement = mouvement;
    
    // Vérifier d'abord si les données de base contiennent déjà des lignes
    const possibleLineFields = ['detailMvts', 'lignes', 'lignesMouvement', 'details', 'detailMvt', 'ligneMouvement'];
    let baseLignesFound = null;
    
    for (const field of possibleLineFields) {
      if (mouvement[field] && Array.isArray(mouvement[field])) {
        baseLignesFound = mouvement[field];
        break;
      }
    }
    
    if (baseLignesFound) {
      this.selectedMouvement.detailMvts = baseLignesFound;
      this.detailsPopUp = true;
      return;
    }
    
    this.mouvementService.getOneById(this.selectedMouvement.idMouvement).subscribe({
      next: (value: any) => {
        // Le service retourne un tableau, on prend le premier élément
        const mouvementDetails = Array.isArray(value) ? value[0] : value;
        
        if (!mouvementDetails) {
          this.selectedMouvement = mouvement;
          this.detailsPopUp = true;
          return;
        }
        
        this.selectedMouvement = { 
          ...mouvement, // Garder les données de la liste
          ...mouvementDetails // Ajouter les détails du service
        };
        
        // Vérifier tous les noms de champs possibles pour les lignes
        let lignesFound = null;
        
        for (const field of possibleLineFields) {
          if (this.selectedMouvement[field] && Array.isArray(this.selectedMouvement[field])) {
            lignesFound = this.selectedMouvement[field];
            break;
          }
        }
        
        if (lignesFound) {
          this.selectedMouvement.detailMvts = lignesFound;
        }
        
        this.detailsPopUp = true;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des détails:', err);
        this.detailsPopUp = true;
      },
    });
  }

  openDeletePopup(mouvement: any): void {
    this.selectedMouvement = mouvement;
    this.selectedId = mouvement.idMouvement;
    this.deletePopUp = true;
  }

  closeModal(): void {
    this.createPopUp = false;
    this.detailsPopUp = false;
    this.deletePopUp = false;
    this.articleSelectionPopUp = false;
    this.selectedMouvement = null;
    this.selectedId = null;
    this.isEditing = false;
    this.showLigneForm = false;
    this.currentLigneIndex = null;
  }

  saveMouvement(): void {
    if (this.mouvementForm.valid) {
      const formData = this.mouvementForm.value;

      const mouvementData: Mouvement = {
        ...formData,
        idMouvement: this.isEditing ? this.selectedId! : Math.max(...this.mouvements.map((m) => m.idMouvement), 0) + 1,
        dateCreation: new Date().toISOString(),
        statut: 'EN_COURS',
        montantTotal: this.calculateTotal(formData.lignes || []),
        utilisateur: 'admin',
        magasinSource: this.getMagasinName(formData.magasinSourceId),
        magasinDestination: formData.magasinDestinationId
          ? this.getMagasinName(formData.magasinDestinationId)
          : undefined,
      };

      if (this.isEditing) {
        // Update existing mouvement
        const index = this.mouvements.findIndex((m) => m.idMouvement === this.selectedId);
        if (index !== -1) {
          this.mouvements[index] = { ...this.mouvements[index], ...mouvementData };
        }
      } else {
        // Add new mouvement
        this.mouvements.unshift(mouvementData);
      }

      this.filteredMouvements = [...this.mouvements];
      this.totalItems = this.mouvements.length;
      this.closeModal();
    }
  }

  deleteMouvement(): void {
    if (this.selectedId) {
      this.mouvements = this.mouvements.filter((m) => m.idMouvement !== this.selectedId);
      this.filteredMouvements = [...this.mouvements];
      this.totalItems = this.mouvements.length;
      this.closeModal();
    }
  }

  // Ligne management
  addLigne(): void {
    if (this.ligneForm.valid) {
      const ligneData = this.ligneForm.value;
      const article = this.articles.find((a) => a.idArticle === ligneData.articleId);

      if (article) {
        const newLigne: MouvementLigne = {
          idLigne: Math.max(...(this.mouvementForm.get('lignes')?.value || []).map((l: any) => l.idLigne), 0) + 1,
          articleId: article.idArticle,
          codeArticle: article.code,
          referenceArticle: article.reference,
          descriptionArticle: article.description,
          quantite: ligneData.quantite,
          prixUnitaire: ligneData.prixUnitaire,
          montantLigne: ligneData.quantite * ligneData.prixUnitaire,
        };

        const lignes = this.mouvementForm.get('lignes')?.value || [];
        lignes.push(newLigne);
        this.mouvementForm.patchValue({ lignes });

        this.ligneForm.reset({
          quantite: 1,
          prixUnitaire: 0,
        });
      }
    }
  }

  removeLigne(index: number): void {
    const lignes = this.mouvementForm.get('lignes')?.value || [];
    lignes.splice(index, 1);
    this.mouvementForm.patchValue({ lignes });
  }

  editLigne(index: number): void {
    const lignes = this.mouvementForm.get('lignes')?.value || [];
    const ligne = lignes[index];

    this.ligneForm.patchValue({
      articleId: ligne.detailCmd?.article?.idArticle,
      quantite: ligne.detailCmd?.quantite,
      prixUnitaire: ligne.prixUnitaire,
    });

    this.currentLigneIndex = index;
    this.showLigneForm = true;
  }

  updateLigne(): void {
    if (this.ligneForm.valid && this.currentLigneIndex !== null) {
      const lignes = this.mouvementForm.get('lignes')?.value || [];

      console.log(lignes[this.currentLigneIndex]);
      console.log(this.ligneForm.value);
      this.commandeService
        .updateDetail(lignes[this.currentLigneIndex]?.detailCmd?.idDetailCmd, {
          article: { idArticle: this.ligneForm.value.articleId },
          quantite: this.ligneForm.value.quantite,
        })
        .subscribe({
          next: (response) => {
            this.mouvementForm.patchValue({ lignes });
            this.showLigneForm = false;
            this.currentLigneIndex = null;
            this.ligneForm.reset({
              quantite: 1,
              prixUnitaire: 0,
            });
          },
          error: (err) => {},
        });

      lignes[this.currentLigneIndex] = {
        ...lignes[this.currentLigneIndex],
        detailCmd: {
          ...lignes[this.currentLigneIndex].detailCmd,

          quantite: this.ligneForm.value.quantite,
        },
      };
    }
  }

  // Utility methods
  calculateTotal(lignes: MouvementLigne[]): number {
    return lignes.reduce((total, ligne) => total + ligne.montantLigne, 0);
  }

  getMagasinName(magasinId: number): string {
    const magasin = this.magasins.find((m) => m.idMagasin === magasinId);
    return magasin ? magasin.nomMagasin : '';
  }

  getTypeLabel(type: string): string {
    const option = this.typeOptions.find((opt) => opt.value === type);
    return option ? option.label : type;
  }

  getStatutLabel(statut: string): string {
    const option = this.statutOptions.find((opt) => opt.value === statut);
    return option ? option.label : statut;
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_COURS':
        return 'bg-yellow-50 text-yellow-800';
      case 'TERMINE':
        return 'bg-green-100 text-green-800';
      case 'ANNULE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  canEdit(mouvement: any): boolean {
    return mouvement.signe === '+'; // Seuls les mouvements d'entrée peuvent être édités
  }

  canDelete(mouvement: any): boolean {
    return mouvement.statut === 'EN_COURS' && this.canEdit(mouvement);
  }

  // Type change handler
  onTypeChange(): void {
    const type = this.mouvementForm.get('typeMouvement')?.value;
    this.selectedTypeMouvement = type;

    // Reset destination magasin for non-transfert types
    if (type !== 'TRANSFERT') {
      this.mouvementForm.patchValue({ magasinDestinationId: null });
    }
  }

  // Type filter change handler
  onTypeFilterChange(event: any, type: string): void {
    const currentTypes = this.filterForm.get('typeMouvement')?.value || [];
    if (event.target.checked) {
      if (!currentTypes.includes(type)) {
        currentTypes.push(type);
      }
    } else {
      const index = currentTypes.indexOf(type);
      if (index > -1) {
        currentTypes.splice(index, 1);
      }
    }
    this.filterForm.patchValue({ typeMouvement: currentTypes });
  }

  // Méthode pour vérifier s'il y a des filtres actifs
  hasActiveFilters(): boolean {
    const filterValues = this.filterForm.value;
    return !!(
      filterValues.dateDebut || 
      filterValues.dateFin || 
      filterValues.libelle || 
      (filterValues.typeMouvement && filterValues.typeMouvement.length > 0) ||
      filterValues.magasinSource ||
      filterValues.typeCommande
    );
  }

  // Méthode pour obtenir le nombre de mouvements filtrés
  getFilteredCount(): number {
    return this.filteredMouvements.length;
  }

  // Méthode pour trier les mouvements par date (du plus récent au plus ancien)
  sortMouvementsByDate(): void {
    this.filteredMouvements.sort((a: any, b: any) => {
      const dateA = new Date(a.dateMvt || a.dateMouvement);
      const dateB = new Date(b.dateMvt || b.dateMouvement);
      return dateB.getTime() - dateA.getTime();
    });
  }

  // Méthode utilitaire pour vérifier si les détails sont disponibles
  hasDetails(mouvement: any): boolean {
    if (!mouvement) return false;
    
    // Vérifier tous les noms de champs possibles pour les lignes
    const possibleLineFields = ['detailMvts', 'lignes', 'lignesMouvement', 'details', 'detailMvt', 'ligneMouvement'];
    
    for (const field of possibleLineFields) {
      if (mouvement[field] && Array.isArray(mouvement[field]) && mouvement[field].length > 0) {
        return true;
      }
    }
    
    return false;
  }

  // Méthode pour obtenir le nombre de lignes de détail
  getDetailCount(mouvement: any): number {
    if (!mouvement) return 0;
    
    // Vérifier tous les noms de champs possibles pour les lignes
    const possibleLineFields = ['detailMvts', 'lignes', 'lignesMouvement', 'details', 'detailMvt', 'ligneMouvement'];
    
    for (const field of possibleLineFields) {
      if (mouvement[field] && Array.isArray(mouvement[field])) {
        return mouvement[field].length;
      }
    }
    
    return 0;
  }

  // Méthodes utilitaires pour extraire les données des lignes
  getLigneCode(ligne: any): string {
    if (!ligne) return '-';
    
    // Essayer différents chemins possibles pour le code
    return ligne?.detailCmd?.article?.code || 
           ligne?.article?.code || 
           ligne?.codeArticle || 
           ligne?.code ||
           ligne?.detailCmd?.code ||
           ligne?.detailMvt?.article?.code ||
           ligne?.detailMvt?.code ||
           '-';
  }

  getLigneReference(ligne: any): string {
    if (!ligne) return '-';
    
    // Essayer différents chemins possibles pour la référence
    return ligne?.detailCmd?.article?.reference || 
           ligne?.article?.reference || 
           ligne?.referenceArticle || 
           ligne?.reference ||
           ligne?.detailCmd?.reference ||
           ligne?.detailMvt?.article?.reference ||
           ligne?.detailMvt?.reference ||
           '-';
  }

  getLigneDescription(ligne: any): string {
    if (!ligne) return '-';
    
    // Essayer différents chemins possibles pour la description
    return ligne?.detailCmd?.article?.description || 
           ligne?.article?.description || 
           ligne?.descriptionArticle || 
           ligne?.description ||
           ligne?.detailCmd?.description ||
           ligne?.detailMvt?.article?.description ||
           ligne?.detailMvt?.description ||
           '-';
  }

  getLigneQuantite(ligne: any): string {
    if (!ligne) return '-';
    
    // Essayer différents chemins possibles pour la quantité
    const quantite = ligne?.detailCmd?.quantite || 
                     ligne?.quantite || 
                     ligne?.qte ||
                     ligne?.detailMvt?.quantite ||
                     ligne?.detailMvt?.qte ||
                     null;
    
    return quantite !== null ? quantite.toString() : '-';
  }

  // Méthode pour obtenir la quantité sous forme numérique (pour les inputs)
  getLigneQuantiteNumber(ligne: any): number {
    if (!ligne) return 0;
    
    // Essayer différents chemins possibles pour la quantité
    const quantite = ligne?.detailCmd?.quantite || 
                     ligne?.quantite || 
                     ligne?.qte ||
                     ligne?.detailMvt?.quantite ||
                     ligne?.detailMvt?.qte ||
                     0;
    
    return typeof quantite === 'number' ? quantite : parseInt(quantite, 10) || 0;
  }

  // Méthode pour afficher les détails de débogage d'une ligne
  debugLigne(ligne: any, index: number): void {
    // Méthode supprimée - plus de débogage nécessaire
  }

  // Méthode pour mettre à jour la quantité d'une ligne directement
  updateLigneQuantite(index: number, event: any): void {
    const newQuantite = parseInt(event.target.value, 10);
    
    if (isNaN(newQuantite) || newQuantite < 1) {
      return; // Valeur invalide, ignorer
    }
    
    const lignes = this.mouvementForm.get('lignes')?.value || [];
    
    if (lignes[index]) {
      // Mettre à jour la quantité dans la ligne
      if (lignes[index].detailCmd) {
        lignes[index].detailCmd.quantite = newQuantite;
      } else {
        lignes[index].quantite = newQuantite;
      }
      
      // Mettre à jour le formulaire
      this.mouvementForm.patchValue({ lignes });
      
      // Optionnel : Sauvegarder automatiquement via l'API
      if (lignes[index]?.detailCmd?.idDetailCmd) {
        this.commandeService.updateDetail(lignes[index].detailCmd.idDetailCmd, {
          quantite: newQuantite
        }).subscribe({
          next: (response) => {
            console.log('Quantité mise à jour avec succès:', response);
          },
          error: (err) => {
            console.error('Erreur lors de la mise à jour de la quantité:', err);
          }
        });
      }
    }
  }
}
