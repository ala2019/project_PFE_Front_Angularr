import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { CommandeService } from 'src/app/core/services/commande.service';
import { PopupComponent } from '../../shared/popup/popup.component';
import { MagasinService } from 'src/app/core/services/magasin.service';
import { MouvementService } from 'src/app/core/services/mouvement.service';
import { Mouvement } from 'src/app/core/models/mouvement.model';

@Component({
  selector: 'app-cmdachat',
  templateUrl: './cmdachat.component.html',
  styleUrls: ['./cmdachat.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PopupComponent],
  standalone: true
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
    dateFin: ''
  };

  // Status options
  statuts = [
    { value: 'LANCE', label: 'Lancé' },
    { value: 'LIVRE_PARTIEL', label: 'Livré partiellement' },
    { value: 'LIVRE_TOTAL', label: 'Livré totalement' }
  ];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  // Math object for template
  Math = Math;

  constructor(
    private fb: FormBuilder, 
    private service: CommandeService,
    private magasinService: MagasinService,
    private mouvementService: MouvementService
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
      libelle: ['', Validators.required],
      dateCommande: [new Date().toISOString().substring(0, 10), Validators.required],
      datePrevue: [''],
      fournisseurId: ['', Validators.required],
      statut: ['LANCE', Validators.required],
      montantTotal: [0, Validators.required],
      lignes: this.fb.array([])
    });

    this.lineForm = this.fb.group({
      code: ['', Validators.required],
      reference: ['', Validators.required],
      description: ['', Validators.required],
      prixUnitaire: [0, [Validators.required, Validators.min(0)]],
      quantite: [1, [Validators.required, Validators.min(1)]]
    });

    this.mouvementForm = this.fb.group({
      libelle: ['', Validators.required],
      dateMouvement: [new Date().toISOString().substring(0, 10), Validators.required],
      magasinId: ['', Validators.required],
      lignes: this.fb.array([])
    });
  }

  loadCommandes(): void {
    // Mock data - replace with actual service calls
    const mockData = [
      {
        idCmd: 1,
        libelle: 'Cmd-Achat-2025/0001',
        dateCommande: '2025-05-15',
        datePrevue: '2025-05-20',
        montantTotal: 15000.00,
        fournisseur: 'Tech Solutions',
        statut: 'LANCE',
        statutLabel: 'Lancé',
        lignes: [
          {
            code: 'ART001',
            reference: 'REF001',
            description: 'Ordinateur portable',
            prixUnitaire: 1200.00,
            quantite: 10,
            sousTotal: 12000.00
          },
          {
            code: 'ART002',
            reference: 'REF002',
            description: 'Écran 24"',
            prixUnitaire: 300.00,
            quantite: 10,
            sousTotal: 3000.00
          }
        ]
      },
      {
        idCmd: 2,
        libelle: 'Cmd-Achat-2025/0002',
        dateCommande: '2025-06-10',
        datePrevue: '2025-06-11',
        montantTotal: 8500.00,
        fournisseur: 'Office Plus',
        statut: 'LIVRE_PARTIEL',
        statutLabel: 'Livré partiellement',
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
        libelle: 'Cmd-Achat-2025/0003',
        dateCommande: '2025-06-24',
        datePrevue: '2025-06-27',
        montantTotal: 3200.00,
        fournisseur: 'Fournitures Pro',
        statut: 'LIVRE_TOTAL',
        statutLabel: 'Livré totalement',
        lignes: [
          {
            code: 'ART005',
            reference: 'REF005',
            description: 'Papier A4',
            prixUnitaire: 8.00,
            quantite: 400,
            sousTotal: 3200.00
          }
        ]
      },
      {
        idCmd: 4,
        libelle: 'Cmd-Achat-2025/0004',
        dateCommande: '2025-06-24',
        datePrevue: '2025-06-28',
        montantTotal: 7500.00,
        fournisseur: 'Tech Solutions',
        statut: 'LANCE',
        statutLabel: 'Lancé',
        lignes: [
          {
            code: 'ART006',
            reference: 'REF006',
            description: 'Switch réseau 24 ports',
            prixUnitaire: 7500.00,
            quantite: 1,
            sousTotal: 7500.00
          }
        ]
      },
      {
        idCmd: 5,
        libelle: 'Cmd-Achat-2025/0005',
        dateCommande: '2025-06-24',
        datePrevue: '2025-06-25',
        montantTotal: 1800.00,
        fournisseur: 'Office Plus',
        statut: 'LIVRE_PARTIEL',
        statutLabel: 'Livré partiellement',
        lignes: [
          {
            code: 'ART007',
            reference: 'REF007',
            description: 'Stylos et crayons',
            prixUnitaire: 2.00,
            quantite: 900,
            sousTotal: 1800.00
          }
        ]
      }
    ];

    this.allCommandes = [...mockData]; // Stockage des données originales
    this.commandes = [...mockData]; // Affichage initial
    this.totalItems = this.commandes.length; // Initialiser le total pour la pagination
    console.log('Loaded commandes:', this.allCommandes.length);
  }

  loadFournisseurs(): void {
    this.fournisseurs = [
      { idPersonne: 1, nom: 'Tech Solutions' },
      { idPersonne: 2, nom: 'Office Plus' },
      { idPersonne: 3, nom: 'Fournitures Pro' }
    ];
  }

  loadArticles(): void {
    this.articles = [
      { idArticle: 1, code: 'ART001', reference: 'REF001', description: 'Ordinateur portable', prix: 1200.00 },
      { idArticle: 2, code: 'ART002', reference: 'REF002', description: 'Écran 24"', prix: 300.00 },
      { idArticle: 3, code: 'ART003', reference: 'REF003', description: 'Bureau ergonomique', prix: 450.00 }
    ];
  }

  loadMagasins(): void {
    this.magasinService.getAll().subscribe(data => {
      this.magasins = data;
    });
  }

  // Filter methods
  applyFilters(): void {
    console.log('Applying filters:', this.filters);
    console.log('All commandes before filtering:', this.allCommandes);
    
    // Filtrer les commandes selon les critères
    this.commandes = this.allCommandes.filter(commande => {
      console.log('Checking commande:', commande);
      
      // Filtre par libellé
      if (this.filters.libelle && !commande.libelle.toLowerCase().includes(this.filters.libelle.toLowerCase())) {
        console.log('Filtered out by libelle:', commande.libelle);
        return false;
      }
      
      // Filtre par statut
      if (this.filters.statut && commande.statut !== this.filters.statut) {
        console.log('Filtered out by statut:', commande.statut, 'expected:', this.filters.statut);
        return false;
      }
      
      // Filtre par fournisseur
      if (this.filters.fournisseur) {
        const fournisseurId = parseInt(this.filters.fournisseur);
        const fournisseur = this.fournisseurs.find(f => f.idPersonne === fournisseurId);
        console.log('Fournisseur filter:', { 
          filterValue: this.filters.fournisseur, 
          fournisseurId, 
          foundFournisseur: fournisseur, 
          commandeFournisseur: commande.fournisseur 
        });
        
        if (!fournisseur || commande.fournisseur !== fournisseur.nom) {
          console.log('Filtered out by fournisseur:', commande.fournisseur, 'expected:', fournisseur?.nom);
          return false;
        }
      }
      
      // Filtre par date de début et fin (bornes)
      if (this.filters.dateDebut || this.filters.dateFin) {
        const commandeDate = new Date(commande.dateCommande);
        
        // Filtre par date de début
        if (this.filters.dateDebut) {
          const filterDateDebut = new Date(this.filters.dateDebut);
          console.log('Date début filter:', { 
            commandeDate: commandeDate.toISOString(), 
            filterDate: filterDateDebut.toISOString(),
            isBefore: commandeDate < filterDateDebut 
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
            isAfter: commandeDate > filterDateFin 
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
      dateFin: ''
    };
    
    // Restaurer toutes les commandes
    this.commandes = [...this.allCommandes];
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
        const index = this.allCommandes.findIndex(c => c.idCmd === this.selectdID);
        if (index !== -1) {
          const fournisseur = this.fournisseurs.find(f => f.idPersonne === formData.fournisseurId);
          const statut = this.statuts.find(s => s.value === formData.statut);
          
          const updatedCommande = {
            ...this.allCommandes[index],
            ...formData,
            fournisseur: fournisseur?.nom,
            statutLabel: statut?.label
          };
          
          this.allCommandes[index] = updatedCommande;
          
          // Mettre à jour aussi dans commandes si elle y est présente
          const commandesIndex = this.commandes.findIndex(c => c.idCmd === this.selectdID);
          if (commandesIndex !== -1) {
            this.commandes[commandesIndex] = updatedCommande;
          }
        }
      } else {
        // Add new commande
        const fournisseur = this.fournisseurs.find(f => f.idPersonne === formData.fournisseurId);
        const statut = this.statuts.find(s => s.value === formData.statut);
        
        const newCommande = {
          ...formData,
          idCmd: Math.max(...this.allCommandes.map(c => c.idCmd), 0) + 1,
          fournisseur: fournisseur?.nom,
          statutLabel: statut?.label
        };
        
        this.allCommandes.push(newCommande);
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
      dateCommande: new Date(commande.dateCommande).toISOString().substring(0, 10),
      datePrevue: new Date(commande.datePrevue).toISOString().substring(0, 10),
      fournisseurId: this.fournisseurs.find(f => f.nom === commande.fournisseur)?.idPersonne,
      statut: commande.statut,
      montantTotal: commande.montantTotal,
      lignes: commande.lignes || []
    });

    this.updateTotal();
    this.createPopUp = true;
  }

  deleteCommande(id: number): void {
    const allIndex = this.allCommandes.findIndex(c => c.idCmd === id);
    const commandesIndex = this.commandes.findIndex(c => c.idCmd === id);
    
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
        sousTotal: this.lineForm.value.prixUnitaire * this.lineForm.value.quantite
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
        sousTotal: this.lineForm.value.prixUnitaire * this.lineForm.value.quantite
      };
      this.commandeLignes.at(this.currentLineIndex).patchValue(updatedLine);
      this.updateTotal();
      this.resetLineForm();
    }
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
      prixUnitaire: 0
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
      montantTotal: 0
    });
    this.commandeLignes.clear();
    this.updateTotal();
    this.resetLineForm();
    this.createPopUp = true;
  }

  getMagasinName(magasinId: any): string {
    const magasin = this.magasins.find(m => m.idMagasin === magasinId);
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

    this.mouvementForm.reset({
      libelle: `Pointage pour commande ${this.selectedCommande.libelle}`,
      dateMouvement: new Date().toISOString().substring(0, 10),
      magasinId: ''
    });
    
    const lignesFormArray = this.mouvementForm.get('lignes') as FormArray;
    lignesFormArray.clear();

    this.selectedCommande.lignes.forEach((ligne: any) => {
      lignesFormArray.push(this.fb.group({
        articleId: [ligne.idArticle], // Assurez-vous que l'ID de l'article est disponible dans la ligne de commande
        codeArticle: [ligne.code],
        referenceArticle: [ligne.reference],
        descriptionArticle: [ligne.description],
        quantite: [ligne.quantite, [Validators.required, Validators.min(0)]],
        prixUnitaire: [ligne.prixUnitaire]
      }));
    });

    this.mouvementPopUp = true;
  }

  saveMouvement(): void {
    if (this.mouvementForm.invalid) {
      return;
    }

    const formValue = this.mouvementForm.value;
    const newMouvement: Mouvement = {
      idMouvement: 0, // Le backend devrait générer l'ID
      libelle: formValue.libelle,
      typeMouvement: 'POINTAGE',
      dateCreation: new Date().toISOString(),
      dateMouvement: new Date(formValue.dateMouvement).toISOString(),
      magasinDestinationId: formValue.magasinId,
      commandeId: this.selectedCommande.idCmd,
      commandeLibelle: this.selectedCommande.libelle,
      statut: 'EN_COURS',
      lignes: formValue.lignes.map((ligne: any) => ({
        ...ligne,
        montantLigne: ligne.quantite * ligne.prixUnitaire
      })),
      montantTotal: formValue.lignes.reduce((total: number, ligne: any) => total + (ligne.quantite * ligne.prixUnitaire), 0),
      utilisateur: 'current_user' // À remplacer par l'utilisateur connecté
    };

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
  }

  // Article selection methods
  openArticleSelection(): void {
    this.articleSelectionPopUp = true;
    this.selectedArticle = null;
    this.articleSearchFilter = '';
  }

  closeArticleSelection(): void {
    this.articleSelectionPopUp = false;
    this.selectedArticle = null;
    this.articleSearchFilter = '';
  }

  getFilteredArticles(): any[] {
    if (!this.articleSearchFilter.trim()) {
      return this.articles;
    }
    
    const filter = this.articleSearchFilter.toLowerCase();
    return this.articles.filter(article => 
      article.code.toLowerCase().includes(filter) ||
      article.reference.toLowerCase().includes(filter) ||
      article.description.toLowerCase().includes(filter)
    );
  }

  selectArticle(article: any): void {
    this.selectedArticle = article;
  }

  isArticleSelected(article: any): boolean {
    return this.selectedArticle ? this.selectedArticle.idArticle === article.idArticle : false;
  }

  addSelectedArticle(): void {
    if (this.selectedArticle) {
      const article = this.selectedArticle;
      const newLine = {
        code: article.code,
        reference: article.reference,
        description: article.description,
        prixUnitaire: article.prix,
        quantite: 1,
        sousTotal: article.prix
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
      case 'LIVRE_PARTIEL':
        return 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800';
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
      console.log('Found commandes:', this.commandes.map(c => ({ 
        id: c.idCmd, 
        libelle: c.libelle, 
        date: c.dateCommande 
      })));
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
}
