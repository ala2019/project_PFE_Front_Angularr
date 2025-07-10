export interface CompanyInfo {
  raisonSociale: string;
  adresse: string;
  telephone: string;
  email: string;
  matriculeFiscale: string;
  codeTVA: string;
  siteWeb?: string;
  capital?: string;
  registreCommerce?: string;
}

export interface FactureConfig {
  company: CompanyInfo;
  tvaRate: number;
  paymentTerms: string;
  latePaymentPenalty: string;
  legalNotice: string[];
  footerText: string;
}

export const FACTURE_CONFIG: FactureConfig = {
  company: {
    raisonSociale: 'GESTI - Gestion des Stocks et Inventaires',
    adresse: '123 Rue de l\'Innovation, 1000 Tunis, Tunisie',
    telephone: '+216 71 123 456',
    email: 'contact@gesti.tn',
    matriculeFiscale: '12345678/A/M/000',
    codeTVA: 'TN12345678',
    siteWeb: 'www.gesti.tn',
    capital: '100 000 TND',
    registreCommerce: 'RC123456'
  },
  tvaRate: 19,
  paymentTerms: '30 jours fin de mois',
  latePaymentPenalty: '0,5% par mois',
  legalNotice: [
    'Cette facture est soumise à la TVA au taux de 19%',
    'Paiement à 30 jours fin de mois',
    'En cas de retard de paiement, une pénalité de 0,5% par mois sera appliquée',
    'Pas d\'escompte en cas de paiement anticipé',
    'Conformément à l\'article 25 du Code de la TVA, cette facture doit être conservée pendant 10 ans',
    'Toute réclamation doit être formulée dans les 8 jours suivant la réception de la facture'
  ],
  footerText: 'GESTI - Gestion des Stocks et Inventaires | 123 Rue de l\'Innovation, 1000 Tunis, Tunisie | Tél: +216 71 123 456 | Email: contact@gesti.tn'
}; 