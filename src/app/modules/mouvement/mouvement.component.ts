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
  itemsPerPage = 10;
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
        console.log(data);
        this.mouvements = data;

        this.filteredMouvements = [...this.mouvements];
        this.totalItems = this.mouvements.length;
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

      if (this.filters.libelle && !mouvement.libelle.toLowerCase().includes(this.filters.libelle.toLowerCase())) {
        match = false;
      }

      if (
        this.filters.typeMouvement &&
        Array.isArray(this.filters.typeMouvement) &&
        this.filters.typeMouvement.length > 0
      ) {
        const type =
          mouvement.typeMouvement === 'POINTAGE' || mouvement.typeMouvement === 'TRANSFERT' ? 'ENTREE' : 'SORTIE';
        if (!this.filters.typeMouvement.includes(type)) {
          match = false;
        }
      }

      if (this.filters.dateDebut && mouvement.dateMouvement < this.filters.dateDebut) {
        match = false;
      }
      if (this.filters.dateFin && mouvement.dateMouvement > this.filters.dateFin) {
        match = false;
      }
      if (this.filters.magasinSource && mouvement.magasinSourceId !== this.filters.magasinSource) {
        match = false;
      }
      if (this.filters.typeCommande && mouvement.typeCommande !== this.filters.typeCommande) {
        match = false;
      }
      return match;
    });

    this.totalItems = this.filteredMouvements.length;
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filters = {};
    this.filteredMouvements = [...this.mouvements];
    this.totalItems = this.mouvements.length;
    this.currentPage = 1;
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
        this.selectedMouvement = { ...value, libCmd: this.selectedMouvement.libCmd };
        mouvement = this.selectedMouvement;
        console.log(mouvement);
        this.mouvementForm.patchValue({
          libelle: mouvement.libMouvement,
          commandeLibelle: mouvement.libCmd,
          typeMouvement: mouvement.signe,
          dateMouvement: new Date(mouvement.dateMvt).toISOString().substring(0, 10),
          magasinSourceId: mouvement.magasin?.idMagasin,
          lignes: mouvement.detailMvts || [],
        });
        this.createPopUp = true;
      },
      error: (err) => {},
    });
  }

  openDetailsPopup(mouvement: Mouvement): void {
    this.selectedMouvement = mouvement;
    this.mouvementService.getOneById(this.selectedMouvement.idMouvement).subscribe({
      next: (value: any) => {
        this.selectedMouvement = { ...value, libCmd: this.selectedMouvement.libCmd };
        this.detailsPopUp = true;
      },
      error: (err) => {},
    });
  }

  openDeletePopup(mouvement: Mouvement): void {
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
        return 'bg-yellow-100 text-yellow-800';
      case 'TERMINE':
        return 'bg-green-100 text-green-800';
      case 'ANNULE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  canEdit(mouvement: Mouvement): boolean {
    return mouvement.typeMouvement === 'POINTAGE' || mouvement.typeMouvement === 'TRANSFERT';
  }

  canDelete(mouvement: Mouvement): boolean {
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
}
