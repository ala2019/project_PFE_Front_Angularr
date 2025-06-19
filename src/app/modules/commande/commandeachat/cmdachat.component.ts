import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommandeService } from 'src/app/core/services/commande.service';
import { PopupComponent } from '../../shared/popup/popup.component';

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
  
  // Selection tracking
  selectdID: number | null = null;
  selectedCommande: any = null;

  // Data arrays
  commandes: any[] = [];
  fournisseurs: any[] = [];
  articles: any[] = [];
  
  // Forms
  commandeForm!: FormGroup;
  lineForm!: FormGroup;
  
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
      datePrevue: ['', Validators.required],
      fournisseurId: ['', Validators.required],
      statut: ['LANCE', Validators.required],
      montantTotal: [0, Validators.required],
      lignes: [[]]
    });

    this.lineForm = this.fb.group({
      code: ['', Validators.required],
      reference: ['', Validators.required],
      description: ['', Validators.required],
      prixUnitaire: [0, [Validators.required, Validators.min(0)]],
      quantite: [1, [Validators.required, Validators.min(1)]]
    });
  }

  loadData(): void {
    // Mock data - replace with actual service calls
    this.commandes = [
      {
        idCmd: 1,
        libelle: 'Commande Matériel Informatique',
        dateCommande: '2024-01-15',
        datePrevue: '2024-01-30',
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
        libelle: 'Commande Mobilier Bureau',
        dateCommande: '2024-01-10',
        datePrevue: '2024-01-25',
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
      }
    ];

    this.fournisseurs = [
      { idPersonne: 1, nom: 'Tech Solutions' },
      { idPersonne: 2, nom: 'Office Plus' },
      { idPersonne: 3, nom: 'Fournitures Pro' }
    ];

    this.articles = [
      { idArticle: 1, code: 'ART001', reference: 'REF001', description: 'Ordinateur portable', prix: 1200.00 },
      { idArticle: 2, code: 'ART002', reference: 'REF002', description: 'Écran 24"', prix: 300.00 },
      { idArticle: 3, code: 'ART003', reference: 'REF003', description: 'Bureau ergonomique', prix: 450.00 }
    ];
  }

  // Filter methods
  applyFilters(): void {
    // Implement filter logic here
    console.log('Applying filters:', this.filters);
  }

  clearFilters(): void {
    this.filters = {
      statut: '',
      fournisseur: '',
      libelle: '',
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
          const fournisseur = this.fournisseurs.find(f => f.idPersonne === formData.fournisseurId);
          const statut = this.statuts.find(s => s.value === formData.statut);
          
          this.commandes[index] = {
            ...this.commandes[index],
            ...formData,
            fournisseur: fournisseur?.nom,
            statutLabel: statut?.label
          };
        }
      } else {
        // Add new commande
        const fournisseur = this.fournisseurs.find(f => f.idPersonne === formData.fournisseurId);
        const statut = this.statuts.find(s => s.value === formData.statut);
        
        const newCommande = {
          ...formData,
          idCmd: Math.max(...this.commandes.map(c => c.idCmd), 0) + 1,
          fournisseur: fournisseur?.nom,
          statutLabel: statut?.label
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
      datePrevue: commande.datePrevue,
      fournisseurId: this.fournisseurs.find(f => f.nom === commande.fournisseur)?.idPersonne,
      statut: commande.statut,
      montantTotal: commande.montantTotal,
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
      const sousTotal = lineData.prixUnitaire * lineData.quantite;
      
      const newLine = {
        ...lineData,
        sousTotal: sousTotal
      };
      
      const lignes = this.commandeForm.get('lignes')?.value || [];
      lignes.push(newLine);
      this.commandeForm.patchValue({ lignes });
      
      this.updateTotal();
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
      this.updateTotal();
      this.resetLineForm();
    }
  }

  deleteLine(index: number): void {
    const lignes = this.commandeForm.get('lignes')?.value || [];
    lignes.splice(index, 1);
    this.commandeForm.patchValue({ lignes });
    this.updateTotal();
  }

  updateTotal(): void {
    const lignes = this.commandeForm.get('lignes')?.value || [];
    const total = lignes.reduce((sum: number, line: any) => sum + line.sousTotal, 0);
    this.commandeForm.patchValue({ montantTotal: total });
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
      statut: 'LANCE',
      montantTotal: 0,
      lignes: []
    });
  }

  closeModal(): void {
    this.createPopUp = false;
    this.detailsPopUp = false;
    this.deletedPopUp = false;
    this.resetLineForm();
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'LANCE': return 'bg-blue-100 text-blue-800';
      case 'LIVRE_PARTIEL': return 'bg-yellow-100 text-yellow-800';
      case 'LIVRE_TOTAL': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getLineStatusClass(statut: string): string {
    switch (statut) {
      case 'LANCE': return 'bg-gray-50 border-l-4 border-gray-300';
      case 'LIVRE_PARTIEL': return 'bg-orange-50 border-l-4 border-orange-400';
      case 'LIVRE_TOTAL': return 'bg-green-50 border-l-4 border-green-500';
      default: return 'bg-gray-50 border-l-4 border-gray-300';
    }
  }
}
