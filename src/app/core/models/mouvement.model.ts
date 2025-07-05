export interface Mouvement {
  idMouvement: number;
  libMouvement: string;
  typeMouvement: 'POINTAGE' | 'TRANSFERT' | 'SORTIE';
  dateCreation: string;
  dateMvt: string;
  magasinSource?: string;
  magasinDestination?: string;
  magasinSourceId?: number;
  magasinDestinationId?: number;
  commandeId?: number;
  commandeLibelle: string;
  statut: 'EN_COURS' | 'TERMINE' | 'ANNULE';
  lignes: MouvementLigne[];
  montantTotal: number;
  utilisateur: string;
  observations?: string;
  typeCommande?: 'ACHAT' | 'VENTE' | 'TRANSFERT';
}

export interface MouvementLigne {
  idLigne: number;
  articleId: number;
  codeArticle: string;
  referenceArticle: string;
  descriptionArticle: string;
  quantite: number;
  prixUnitaire: number;
  montantLigne: number;
}

export interface MouvementFilter {
  libelle?: string;
  typeMouvement?: string[];
  dateDebut?: string;
  dateFin?: string;
  magasinSource?: number;
  typeCommande?: 'ACHAT' | 'VENTE' | 'TRANSFERT';
  statut?: string;
} 