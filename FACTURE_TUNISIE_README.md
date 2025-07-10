# Modèle de Facture Tunisien - GESTI

## 📋 Description

Ce modèle de facture est conforme aux standards fiscaux tunisiens et respecte la législation en vigueur. Il inclut tous les éléments requis par l'administration fiscale tunisienne.

## 🏢 Informations de l'Entreprise

### Configuration
Les informations de l'entreprise sont configurables dans le fichier `src/app/core/constants/facture.config.ts` :

```typescript
export const FACTURE_CONFIG: FactureConfig = {
  company: {
    raisonSociale: 'Votre Raison Sociale',
    adresse: 'Votre Adresse Complète',
    telephone: 'Votre Téléphone',
    email: 'votre@email.tn',
    matriculeFiscale: 'Votre Matricule Fiscale',
    codeTVA: 'Votre Code TVA',
    siteWeb: 'www.votre-site.tn',
    capital: 'Votre Capital',
    registreCommerce: 'Votre RC'
  },
  // ... autres configurations
};
```

### Éléments Requis par la Législation Tunisienne

1. **Raison sociale** de l'entreprise
2. **Adresse complète** de l'entreprise
3. **Matricule fiscale** (format: XXXXXXXX/A/M/000)
4. **Code TVA** (format: TNXXXXXXXX)
5. **Téléphone** et **email** de contact

## 📄 Structure de la Facture

### 1. En-tête
- Logo de l'entreprise
- Titre "FACTURE"
- Numéro de facture

### 2. Informations de l'Entreprise
- Toutes les informations légales requises
- Coordonnées complètes

### 3. Détails de Facturation
- **Informations de facturation** : date, numéro, ID
- **Informations client** : nom, adresse, coordonnées

### 4. Tableau des Commandes
- Numéro de commande
- Date de commande
- Libellé
- Montant HT
- TVA (19%)
- Montant TTC

### 5. Totaux
- Total HT
- Total TVA (19%)
- Total TTC
- Arrondi

### 6. Mentions Légales
Conformément au Code de la TVA tunisien :
- Taux de TVA applicable
- Conditions de paiement
- Pénalités de retard
- Conservation des documents
- Délais de réclamation

### 7. Section Signatures
- Espace pour signature client
- Espace pour signature entreprise

### 8. Pied de Page
- Informations de contact
- Références fiscales
- Date de génération

## 🎨 Style et Format

### Format d'Impression
- **Format** : A4
- **Marges** : 1cm
- **Police** : Arial
- **Couleurs** : Noir et blanc (optimisé pour impression)

### Éléments Visuels
- Bordures noires pour un aspect professionnel
- Sections bien délimitées
- Tableaux structurés
- Espaces de signature

## ⚙️ Configuration

### Personnalisation des Mentions Légales
```typescript
legalNotice: [
  'Cette facture est soumise à la TVA au taux de 19%',
  'Paiement à 30 jours fin de mois',
  'En cas de retard de paiement, une pénalité de 0,5% par mois sera appliquée',
  // Ajoutez vos propres mentions
]
```

### Taux de TVA
```typescript
tvaRate: 19, // Modifiable selon votre activité
```

### Conditions de Paiement
```typescript
paymentTerms: '30 jours fin de mois',
latePaymentPenalty: '0,5% par mois',
```

## 📋 Conformité Légale

### Code de la TVA Tunisien
- **Article 25** : Conservation des factures pendant 10 ans
- **Article 26** : Mentions obligatoires
- **Article 27** : Conditions de délivrance

### Éléments Obligatoires
✅ Raison sociale  
✅ Adresse complète  
✅ Matricule fiscale  
✅ Code TVA  
✅ Numéro de facture  
✅ Date de facture  
✅ Informations client  
✅ Détail des prestations  
✅ Montants HT et TTC  
✅ Taux de TVA  
✅ Mentions légales  

## 🚀 Utilisation

1. **Configurer** les informations de votre entreprise dans `facture.config.ts`
2. **Personnaliser** les mentions légales selon vos besoins
3. **Adapter** le taux de TVA si nécessaire
4. **Tester** l'impression pour vérifier la mise en page

## 📞 Support

Pour toute question concernant la conformité fiscale, consultez :
- Le Code de la TVA tunisien
- L'administration fiscale tunisienne
- Un expert-comptable tunisien

---

**Note** : Ce modèle est conforme aux standards tunisiens mais doit être validé par votre expert-comptable pour votre situation spécifique. 