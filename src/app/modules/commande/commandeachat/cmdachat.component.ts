import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { CommandeService } from 'src/app/core/services/commande.service';
import { PopupComponent } from '../../shared/popup/popup.component';
import { MagasinService } from 'src/app/core/services/magasin.service';
import { MouvementService } from 'src/app/core/services/mouvement.service';
import { Mouvement } from 'src/app/core/models/mouvement.model';
import { PersonneService } from 'src/app/core/services/personne.service';
import { ArticleService } from 'src/app/core/services/article.service';

@Component({
  selector: 'app-cmdachat',
  templateUrl: './cmdachat.component.html',
  styleUrls: ['./cmdachat.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PopupComponent],
  standalone: true,
})
export class CmdAchatComponent implements OnInit {
  // Popup management
  createPopUp = false;
  detailsPopUp = false;
  deletedPopUp = false;
  mouvementPopUp = false;
  articleSelectionPopUp = false;

  // Selection tracking
  selectdID: number | null = null;
  selectedCommande: any = null;

  // Data arrays
  commandes: any[] = [];
  allCommandes: any[] = []; // Stockage des données originales
  fournisseurs: any[] = [];
  articles: any[] = [];
  magasins: any[] = [];
  mouvements: Mouvement[] = [];

  // Article selection
  articleSearchFilter = '';
  selectedArticle: any | null = null;

  // Pagination pour la sélection d'articles
  articleCurrentPage = 1;
  articleItemsPerPage = 5;
  articleTotalItems = 0;

  // Forms
  commandeForm!: FormGroup;
  lineForm!: FormGroup;
  mouvementForm!: FormGroup;

  // State management
  isEditing = false;
  showLineForm = false;
  currentLineIndex: number | null = null;

  // Filters
  filters = {
    statut: '',
    fournisseur: '',
    libelle: '',
    dateDebut: '',
    dateFin: '',
  };

  // Status options
  statuts = [
    { value: 'LANCE', label: 'Lancé' },
    { value: 'LIVRE_PARTIELLEMENT', label: 'Livré partiellement' },
    { value: 'LIVRE_TOTAL', label: 'Livré totalement' },
  ];

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  totalItems = 0;

  // Math object for template
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private commandeService: CommandeService,
    private magasinService: MagasinService,
    private mouvementService: MouvementService,
    private personneService: PersonneService,
    private articleService: ArticleService,
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.loadCommandes();
    this.loadFournisseurs();
    this.loadArticles();
    this.loadMagasins();
  }

  initForms(): void {
    this.commandeForm = this.fb.group({
      libelle: [''],
      dateCommande: [new Date().toISOString().substring(0, 10), Validators.required],
      datePrevue: [''],
      fournisseurId: ['', Validators.required],
      statut: ['LANCE', Validators.required],
      montantTotal: [0, Validators.required],
      lignes: this.fb.array([]),
    });

    this.lineForm = this.fb.group({
      code: ['', Validators.required],
      reference: ['', Validators.required],
      description: ['', Validators.required],
      prixUnitaire: [0, [Validators.required, Validators.min(0)]],
      quantite: [1, [Validators.required, Validators.min(1)]],
    });

    this.mouvementForm = this.fb.group({
      libelle: ['', Validators.required],
      dateMouvement: [new Date().toISOString().substring(0, 10), Validators.required],
      magasinId: ['', Validators.required],
      lignes: this.fb.array([]),
    });
  }

  loadCommandes(): void {
    this.commandeService.getAll().subscribe({
      next: (data) => {
        data = data.filter((commande: any) => commande.type == 'ACHAT');
        
        // Trier les commandes par date de commande (du plus récent au plus ancien)
        data.sort((a: any, b: any) => {
          const dateA = new Date(a.dateCmd || a.dateCommande);
          const dateB = new Date(b.dateCmd || b.dateCommande);
          return dateB.getTime() - dateA.getTime();
        });
        
        this.allCommandes = data;
        this.commandes = data;
        this.totalItems = this.commandes.length;
        console.log('Commandes d\'achat triées par date:', data);
        
        // Déboguer les statuts disponibles
        this.debugStatuts();
      },
      error: (error) => {
        console.error('Error loading commandes:', error);
      },
    });
  }

  loadFournisseurs(): void {
    this.personneService.getAll().subscribe({
      next: (data) => {
        this.fournisseurs = data.filter((personne: any) => personne.type == 'FOURNISSEUR');
      },
      error: (error) => {
        console.error('Error loading fournisseurs:', error);
      },
    });
  }

  loadArticles(): void {
    this.articleService.getArticles().subscribe({
      next: (response: any) => {
        this.articles = response;
      },
      error: (err) => {},
    });
  }

  loadMagasins(): void {
    this.magasinService.getAll().subscribe((data) => {
      this.magasins = data;
    });
  }

  // Méthode pour trier les commandes par date (du plus récent au plus ancien)
  sortCommandesByDate(): void {
    this.commandes.sort((a: any, b: any) => {
      const dateA = new Date(a.dateCmd || a.dateCommande);
      const dateB = new Date(b.dateCmd || b.dateCommande);
      return dateB.getTime() - dateA.getTime();
    });
  }

  // Filter methods
  applyFilters(): void {
    console.log('Applying filters:', this.filters);
    console.log('All commandes before filtering:', this.allCommandes);

    // Filtrer les commandes selon les critères
    this.commandes = this.allCommandes.filter((commande) => {
      console.log('Checking commande:', commande);

      // Filtre par libellé
      if (this.filters.libelle && !commande.libCmd.toLowerCase().includes(this.filters.libelle.toLowerCase())) {
        console.log('Filtered out by libelle:', commande.libCmd);
        return false;
      }

      // Filtre par statut
      if (this.filters.statut) {
        const normalizedCommandeStatut = this.normalizeStatut(commande.statut);
        const normalizedFilterStatut = this.normalizeStatut(this.filters.statut);
        
        console.log('Statut filter check:', {
          commandeStatut: commande.statut,
          normalizedCommandeStatut: normalizedCommandeStatut,
          filterStatut: this.filters.statut,
          normalizedFilterStatut: normalizedFilterStatut,
          isMatch: normalizedCommandeStatut === normalizedFilterStatut
        });
        
        if (normalizedCommandeStatut !== normalizedFilterStatut) {
          console.log('Filtered out by statut:', commande.statut, 'expected:', this.filters.statut);
          return false;
        }
      }

      // Filtre par fournisseur
      if (this.filters.fournisseur) {
        const fournisseurId = parseInt(this.filters.fournisseur);
        const fournisseur = this.fournisseurs.find((f) => f.idPersonne === fournisseurId);
        console.log('Fournisseur filter:', {
          filterValue: this.filters.fournisseur,
          fournisseurId,
          foundFournisseur: fournisseur,
          commandeFournisseur: commande.personne?.nomPersonne,
        });

        if (!fournisseur || commande.personne?.nomPersonne !== fournisseur.nomPersonne) {
          console.log('Filtered out by fournisseur:', commande.personne?.nomPersonne, 'expected:', fournisseur?.nomPersonne);
          return false;
        }
      }

      // Filtre par date de début et fin (bornes)
      if (this.filters.dateDebut || this.filters.dateFin) {
        const commandeDate = new Date(commande.dateCmd);

        // Filtre par date de début
        if (this.filters.dateDebut) {
          const filterDateDebut = new Date(this.filters.dateDebut);
          console.log('Date début filter:', {
            commandeDate: commandeDate.toISOString(),
            filterDate: filterDateDebut.toISOString(),
            isBefore: commandeDate < filterDateDebut,
          });

          if (commandeDate < filterDateDebut) {
            console.log('Filtered out by date début');
            return false;
          }
        }

        // Filtre par date de fin
        if (this.filters.dateFin) {
          const filterDateFin = new Date(this.filters.dateFin);
          console.log('Date fin filter:', {
            commandeDate: commandeDate.toISOString(),
            filterDate: filterDateFin.toISOString(),
            isAfter: commandeDate > filterDateFin,
          });

          if (commandeDate > filterDateFin) {
            console.log('Filtered out by date fin');
            return false;
          }
        }
      }

      console.log('Commande passed all filters:', commande);
      return true;
    });

    // Appliquer le tri après le filtrage
    this.sortCommandesByDate();

    // Mettre à jour le total et revenir à la première page
    this.totalItems = this.commandes.length;
    this.currentPage = 1;

    console.log('Filtered commandes result:', this.commandes);
  }

  clearFilters(): void {
    console.log('Clearing filters...');
    this.filters = {
      statut: '',
      fournisseur: '',
      libelle: '',
      dateDebut: '',
      dateFin: '',
    };

    // Restaurer toutes les commandes
    this.commandes = [...this.allCommandes];
    
    // Appliquer le tri après avoir restauré les données
    this.sortCommandesByDate();
    
    this.totalItems = this.commandes.length;
    this.currentPage = 1;
    console.log('Filters cleared, showing all commandes:', this.commandes.length);
  }

  // Commande management
  saveCommande(): void {
    if (this.commandeForm.valid) {
      const formData = this.commandeForm.getRawValue();

      if (this.isEditing) {
        // Update existing commande
        const index = this.allCommandes.findIndex((c) => c.idCmd === this.selectdID);
        if (index !== -1) {
          const updatedCommande = {
            type: 'ACHAT',
            personne: { idPersonne: +formData.fournisseurId },
            dateCmd: formData.dateCommande,
            dateLivraison: formData.datePrevue,
            statut: formData.statut,
            detailCmds: formData.lignes.map((item: any) => ({
              idDetailCmd: item.idDetailCmd,
              article: { idArticle: item.article?.idArticle },
              quantite: item.quantite,
              prix: item.prixUnitaire,
              sousTotal: item.sousTotal,
            })),
          };

          this.allCommandes[index] = updatedCommande;

          this.commandeService.update(this.selectdID, updatedCommande).subscribe({
            next: (data) => {
              this.loadCommandes();
            },
            error: (error) => {
              console.error('Error updating commande:', error);
            },
          });
        }
      } else {
        // Add new commande
        const newCommande = {
          dateCmd: formData.dateCommande,
          dateLivraison: formData.datePrevue,
          personne: { idPersonne: +formData.fournisseurId },
          type: 'ACHAT',
          statut: formData.statut,
          detailCmds: formData.lignes.map((item: any) => ({
            article: { idArticle: item.id_article },
            quantite: item.quantite,
            prix: item.prixUnitaire,
            sousTotal: item.sousTotal,
          })),
        };

        this.commandeService.create(newCommande).subscribe({
          next: (data) => {
            this.loadCommandes();
          },
          error: (error) => {
            console.error('Error creating commande:', error);
          },
        });
      }

      this.closeModal();
    }
  }

  editCommande(commande: any): void {
    this.selectdID = commande.idCmd;
    this.selectedCommande = commande;
    this.isEditing = true;

    // Patch main fields except 'lignes'
    this.commandeForm.patchValue({
      libelle: commande.libCmd,
      dateCommande: new Date(commande.dateCmd).toISOString().substring(0, 10),
      datePrevue: commande.dateLivraison ? new Date(commande.dateLivraison).toISOString().substring(0, 10) : null,
      fournisseurId: commande.personne?.idPersonne,
      statut: commande.statut,
      montantTotal: commande.montantTotal,
    });

    // Clear and repopulate the lignes FormArray
    const lignesArray = this.commandeForm.get('lignes') as FormArray;
    lignesArray.clear();
    if (commande.detailCmds && Array.isArray(commande.detailCmds)) {
      commande.detailCmds.forEach((item: any) => {
        lignesArray.push(
          this.fb.group({
            idDetailCmd: item.idDetailCmd,
            quantite: item.quantite,
            prixUnitaire: item.prix,
            sousTotal: item.sousTotal,
            article: item.article,
          }),
        );
      });
    }

    this.createPopUp = true;
  }

  deleteCommande(id: number): void {
    const allIndex = this.allCommandes.findIndex((c) => c.idCmd === id);
    const commandesIndex = this.commandes.findIndex((c) => c.idCmd === id);

    if (allIndex !== -1) {
      this.allCommandes.splice(allIndex, 1);
    }

    if (commandesIndex !== -1) {
      this.commandes.splice(commandesIndex, 1);
    }

    this.selectdID = null;
    this.selectedCommande = null;
    this.closeModal();
  }

  viewDetails(commande: any): void {
    this.selectedCommande = commande;
    this.detailsPopUp = true;
  }

  // Line item management
  get commandeLignes(): FormArray {
    return this.commandeForm.get('lignes') as FormArray;
  }

  addLine(): void {
    if (this.lineForm.valid) {
      const newLine = {
        ...this.lineForm.value,
        sousTotal: this.lineForm.value.prixUnitaire * this.lineForm.value.quantite,
      };
      this.commandeLignes.push(this.fb.group(newLine));
      this.updateTotal();
      this.resetLineForm();
    }
  }

  editLine(index: number): void {
    const line = this.commandeLignes.at(index).value;
    this.lineForm.patchValue(line);
    this.currentLineIndex = index;
    this.showLineForm = true;
  }

  updateLine(): void {
    if (this.lineForm.valid && this.currentLineIndex !== null) {
      const updatedLine = {
        ...this.lineForm.value,
        sousTotal: this.lineForm.value.prixUnitaire * this.lineForm.value.quantite,
      };
      this.commandeLignes.at(this.currentLineIndex).patchValue(updatedLine);
      this.updateTotal();
      this.resetLineForm();
    }
  }

  // Update line quantity in table
  updateLineQuantity(index: number, event: any): void {
    const newQuantity = parseInt(event.target.value) || 1;
    
    if (newQuantity < 1) {
      alert('La quantité doit être au moins égale à 1');
      event.target.value = 1;
      return;
    }

    const line = this.commandeLignes.at(index);
    const currentValue = line.value;
    const updatedLine = {
      ...currentValue,
      quantite: newQuantity,
      sousTotal: currentValue.prixUnitaire * newQuantity,
    };
    
    line.patchValue(updatedLine);
    this.updateTotal();
  }

  // Update line prix unitaire in table
  updateLinePrixUnitaire(index: number, event: any): void {
    const newPrixUnitaire = parseFloat(event.target.value) || 0;
    
    if (newPrixUnitaire < 0) {
      alert('Le prix unitaire doit être positif');
      event.target.value = 0;
      return;
    }

    const line = this.commandeLignes.at(index);
    const currentValue = line.value;
    const updatedLine = {
      ...currentValue,
      prixUnitaire: newPrixUnitaire,
      sousTotal: newPrixUnitaire * currentValue.quantite,
    };
    
    line.patchValue(updatedLine);
    this.updateTotal();
  }

  deleteLine(index: number): void {
    this.commandeLignes.removeAt(index);
    this.updateTotal();
  }

  updateTotal(): void {
    const total = this.commandeLignes.value.reduce((acc: number, line: any) => acc + line.sousTotal, 0);
    this.commandeForm.get('montantTotal')?.setValue(total);
  }

  resetLineForm(): void {
    this.lineForm.reset({
      quantite: 1,
      prixUnitaire: 0,
    });
    this.showLineForm = false;
    this.currentLineIndex = null;
  }

  // Modal management
  openModal(): void {
    this.isEditing = false;
    this.commandeForm.reset({
      libelle: '',
      dateCommande: new Date().toISOString().substring(0, 10),
      datePrevue: '',
      fournisseurId: '',
      statut: 'LANCE',
      montantTotal: 0,
    });
    this.commandeLignes.clear();
    this.updateTotal();
    this.resetLineForm();
    this.createPopUp = true;
  }

  getMagasinName(magasinId: any): string {
    const magasin = this.magasins.find((m) => m.idMagasin === magasinId);
    return magasin ? magasin.libelle : 'N/A';
  }

  closeModal(): void {
    this.createPopUp = false;
    this.detailsPopUp = false;
    this.deletedPopUp = false;
    this.mouvementPopUp = false;
    this.selectdID = null;
    this.selectedCommande = null;
    this.isEditing = false;
    this.resetLineForm();
  }

  // Mouvement creation
  openMouvementPopup(): void {
    if (!this.selectedCommande) return;

    // Générer automatiquement le libellé du mouvement
    const libelleMouvement = `Pointage pour commande ${this.selectedCommande.libCmd}`;
    
    this.mouvementForm.reset({
      libelle: libelleMouvement,
      dateMouvement: new Date().toISOString().substring(0, 10),
      magasinId: '',
    });

    const lignesFormArray = this.mouvementForm.get('lignes') as FormArray;
    lignesFormArray.clear();
    console.log(this.selectedCommande);

    this.selectedCommande?.detailCmds.forEach((ligne: any) => {
      lignesFormArray.push(
        this.fb.group({
          detailCmd: [{ idDetailCmd: ligne.idDetailCmd }],
          articleId: [ligne.article?.idArticle], // Assurez-vous que l'ID de l'article est disponible dans la ligne de commande
          codeArticle: [ligne.article?.code],
          referenceArticle: [ligne.article?.reference],
          descriptionArticle: [ligne.article?.description],
          quantite: [ligne.quantite, [Validators.required, Validators.min(0)]],
          prixUnitaire: [ligne.prixUnitaire],
        }),
      );
    });

    this.mouvementPopUp = true;
  }

  saveMouvement(): void {
    if (this.mouvementForm.invalid) {
      return;
    }

    const formValue = this.mouvementForm.value;
    
    // S'assurer que le libellé est toujours défini
    if (!formValue.libelle) {
      formValue.libelle = `Pointage pour commande ${this.selectedCommande?.libCmd || 'N/A'}`;
    }
    const newMouvement: any = {
      libelle: formValue.libelle, // Ajout du libellé du formulaire
      signe: '+',
      dateMvt: new Date(formValue.dateMouvement).toISOString(),
      magasinDestinationId: formValue.magasinId,
      commandeId: this.selectedCommande.idCmd,
      magasin: { idMagasin: formValue.magasinId },
      lignes: formValue.lignes.map((ligne: any) => ({
        ...ligne,
        montantLigne: ligne.quantite * ligne.prixUnitaire,
      })),
      montantTotal: formValue.lignes.reduce(
        (total: number, ligne: any) => total + ligne.quantite * ligne.prixUnitaire,
        0,
      ),
      utilisateur: 'current_user', // À remplacer par l'utilisateur connecté
    };

    newMouvement.lignes.map((item: any) => {
      this.commandeService.pointerReception(item?.detailCmd?.idDetailCmd, formValue.magasinId, item).subscribe({
        next(value) {
          console.log(value);
          
        },
        error(err) {},
      });
    });

    console.log('Saving mouvement:', newMouvement);

    // this.mouvementService.create(newMouvement).subscribe({
    //   next: (response) => {
    //     console.log('Mouvement créé avec succès', response);
    //     this.closeModal();
    //     // Optionnel : rafraîchir la liste des commandes ou notifier l'utilisateur
    //   },
    //   error: (err) => {
    //     console.error('Erreur lors de la création du mouvement', err);
    //   }
    // });

    this.closeModal(); // Pour la démo sans backend
    this.loadCommandes();
  }

  // Article selection methods
  openArticleSelection(): void {
    this.articleSelectionPopUp = true;
    this.selectedArticle = null;
    this.articleSearchFilter = '';
    this.articleCurrentPage = 1; // Réinitialiser la pagination
  }

  closeArticleSelection(): void {
    this.articleSelectionPopUp = false;
    this.selectedArticle = null;
    this.articleSearchFilter = '';
    this.articleCurrentPage = 1; // Réinitialiser la pagination
  }

  getFilteredArticles(): any[] {
    if (!this.articleSearchFilter.trim()) {
      return this.articles;
    }

    const filter = this.articleSearchFilter.toLowerCase();
    return this.articles.filter(
      (article) =>
        article.code.toLowerCase().includes(filter) ||
        article.reference.toLowerCase().includes(filter) ||
        article.description.toLowerCase().includes(filter),
    );
  }

  // Méthodes de pagination pour les articles
  get paginatedArticles(): any[] {
    const filteredArticles = this.getFilteredArticles();
    this.articleTotalItems = filteredArticles.length;
    const startIndex = (this.articleCurrentPage - 1) * this.articleItemsPerPage;
    const endIndex = startIndex + this.articleItemsPerPage;
    return filteredArticles.slice(startIndex, endIndex);
  }

  get articleTotalPages(): number {
    return Math.ceil(this.articleTotalItems / this.articleItemsPerPage);
  }

  changeArticlePage(page: number): void {
    if (page >= 1 && page <= this.articleTotalPages) {
      this.articleCurrentPage = page;
    }
  }

  // Méthode pour réinitialiser la pagination des articles lors de la recherche
  onArticleSearchChange(): void {
    this.articleCurrentPage = 1;
  }

  selectArticle(article: any): void {
    this.selectedArticle = article;
  }

  isArticleSelected(article: any): boolean {
    return this.selectedArticle ? this.selectedArticle.idArticle === article.idArticle : false;
  }

  get getDevise() {
    const forniseur = this.fournisseurs.find((f) => f.idPersonne == this.commandeForm.get('fournisseurId')?.value);
    if (forniseur) return forniseur?.devise?.devise ?? 'N/A';
    return 'N/A';
  }

  addSelectedArticle(): void {
    if (this.selectedArticle) {
      const article = this.selectedArticle;
      const newLine = {
        code: article.code,
        reference: article.reference,
        description: article.description,
        prixUnitaire: 0,
        quantite: 1,
        sousTotal: 0,
        id_article: article.idArticle,
      };
      this.commandeLignes.push(this.fb.group(newLine));
      this.updateTotal();
      this.closeArticleSelection();
    }
  }

  // UI helpers
  getLineStatusClass(statut: string): string {
    switch (statut) {
      case 'LANCE':
        return 'bg-blue-50 hover:bg-blue-100 text-blue-800';
      case 'LIVRE_PARTIELLEMENT':
        return 'bg-yellow-50 hover:bg-yellow-200 text-yellow-800';
      case 'LIVRE_TOTAL':
        return 'bg-green-50 hover:bg-green-100 text-green-800';
      default:
        return 'bg-white hover:bg-gray-50 text-gray-900';
    }
  }

  // Test method for date filtering
  testDateFilter(): void {
    console.log('=== TESTING DATE FILTERS ===');

    // Test avec différentes combinaisons de dates
    const testCases = [
      { dateDebut: '2024-01-15', dateFin: '2024-01-20', expected: 2 }, // Devrait trouver 2 commandes
      { dateDebut: '2024-02-01', dateFin: '2024-02-15', expected: 2 }, // Devrait trouver 2 commandes
      { dateDebut: '2024-01-01', dateFin: '2024-12-31', expected: 5 }, // Devrait trouver toutes les commandes
      { dateDebut: '2024-01-15', dateFin: '', expected: 4 }, // Devrait trouver 4 commandes (à partir du 15/01)
      { dateDebut: '', dateFin: '2024-01-20', expected: 3 }, // Devrait trouver 3 commandes (jusqu'au 20/01)
    ];

    testCases.forEach((testCase, index) => {
      console.log(`\n--- Test Case ${index + 1} ---`);
      console.log('Test:', testCase);

      this.filters.dateDebut = testCase.dateDebut;
      this.filters.dateFin = testCase.dateFin;

      this.applyFilters();

      console.log(`Result: ${this.commandes.length} commandes found (expected: ${testCase.expected})`);
      console.log(
        'Found commandes:',
        this.commandes.map((c) => ({
          id: c.idCmd,
          libelle: c.libelle,
          date: c.dateCommande,
        })),
      );
    });

    // Reset filters
    this.clearFilters();
  }

  // Pagination methods
  get paginatedCommandes(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.commandes.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.libelle || this.filters.statut || this.filters.fournisseur || this.filters.dateDebut || this.filters.dateFin);
  }

  getFilteredCount(): number {
    return this.commandes.length;
  }

  // Méthode pour obtenir le label d'un statut
  getStatutLabel(statutValue: string): string {
    const statut = this.statuts.find(s => s.value === statutValue);
    return statut ? statut.label : statutValue;
  }

  // Méthode pour normaliser les valeurs de statut
  normalizeStatut(statut: string): string {
    if (!statut) return '';
    return statut.trim().toUpperCase();
  }

  // Méthode pour déboguer les statuts disponibles
  debugStatuts(): void {
    console.log('=== DEBUG STATUTS ===');
    console.log('Statuts définis:', this.statuts);
    
    const uniqueStatuts = [...new Set(this.allCommandes.map(c => c.statut))];
    console.log('Statuts trouvés dans les données:', uniqueStatuts);
    
    uniqueStatuts.forEach(statut => {
      const normalized = this.normalizeStatut(statut);
      const found = this.statuts.find(s => s.value === normalized);
      console.log(`Statut: "${statut}" -> Normalisé: "${normalized}" -> Trouvé: ${found ? 'OUI' : 'NON'}`);
    });
  }
}
