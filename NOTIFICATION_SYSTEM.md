# Système de Notification - Gesti.Com

## Vue d'ensemble

Le système de notification de Gesti.Com utilise la bibliothèque `ngx-sonner` pour afficher des notifications élégantes et modernes. Le service `NotificationService` fournit une interface simple et cohérente pour gérer tous les types de notifications.

## Installation et Configuration

Le système est déjà configuré dans l'application. La bibliothèque `ngx-sonner` est installée et le composant `NgxSonnerToaster` est inclus dans `app.component.html`.

## Utilisation du Service de Notification

### Import du Service

```typescript
import { NotificationService } from 'src/app/core/services/notification.service';

constructor(private notificationService: NotificationService) {}
```

### Types de Notifications Disponibles

#### 1. Notification de Succès
```typescript
this.notificationService.success(
  'Titre du succès',
  'Message de succès détaillé',
  5000 // durée en millisecondes (optionnel, défaut: 5000)
);
```

#### 2. Notification d'Erreur
```typescript
this.notificationService.error(
  'Titre de l\'erreur',
  'Message d\'erreur détaillé',
  7000 // durée en millisecondes (optionnel, défaut: 7000)
);
```

#### 3. Notification d'Avertissement
```typescript
this.notificationService.warning(
  'Titre de l\'avertissement',
  'Message d\'avertissement détaillé',
  6000 // durée en millisecondes (optionnel, défaut: 6000)
);
```

#### 4. Notification d'Information
```typescript
this.notificationService.info(
  'Titre de l\'information',
  'Message d\'information détaillé',
  5000 // durée en millisecondes (optionnel, défaut: 5000)
);
```

#### 5. Notification de Chargement
```typescript
// Afficher une notification de chargement
const loadingId = this.notificationService.loading(
  'Chargement en cours...',
  'Veuillez patienter pendant le traitement.'
);

// Supprimer la notification de chargement
this.notificationService.dismiss(loadingId);
```

#### 6. Notification Personnalisée
```typescript
this.notificationService.custom(
  'Titre personnalisé',
  'Message personnalisé',
  {
    duration: 10000,
    position: 'top-center',
    // autres options ngx-sonner
  }
);
```

### Méthodes Utilitaires

#### Supprimer une Notification Spécifique
```typescript
this.notificationService.dismiss(notificationId);
```

#### Supprimer Toutes les Notifications
```typescript
this.notificationService.dismissAll();
```

## Exemples d'Utilisation

### Dans un Service d'Authentification
```typescript
login(credentials: any): void {
  this.authService.login(credentials).subscribe({
    next: (response) => {
      this.notificationService.success(
        'Connexion réussie !',
        'Vous êtes maintenant connecté à votre espace.'
      );
      this.router.navigate(['/dashboard']);
    },
    error: (error) => {
      this.notificationService.error(
        'Échec de connexion',
        'Login ou mot de passe incorrect.'
      );
    }
  });
}
```

### Dans un Service de Gestion des Données
```typescript
saveData(data: any): void {
  const loadingId = this.notificationService.loading(
    'Sauvegarde en cours...',
    'Veuillez patienter pendant la sauvegarde.'
  );

  this.dataService.save(data).subscribe({
    next: (response) => {
      this.notificationService.dismiss(loadingId);
      this.notificationService.success(
        'Données sauvegardées !',
        'Les modifications ont été enregistrées avec succès.'
      );
    },
    error: (error) => {
      this.notificationService.dismiss(loadingId);
      this.notificationService.error(
        'Erreur de sauvegarde',
        'Impossible de sauvegarder les données. Veuillez réessayer.'
      );
    }
  });
}
```

### Dans un Composant avec Validation
```typescript
onSubmit(): void {
  if (this.form.invalid) {
    this.notificationService.warning(
      'Formulaire incomplet',
      'Veuillez remplir tous les champs obligatoires.'
    );
    return;
  }

  // Traitement du formulaire...
  this.notificationService.success(
    'Formulaire envoyé !',
    'Vos données ont été traitées avec succès.'
  );
}
```

## Personnalisation

### Position des Notifications
Les notifications apparaissent par défaut en haut à droite (`top-right`). Vous pouvez modifier la position dans le service ou utiliser des options personnalisées.

### Durée d'Affichage
- **Succès** : 5 secondes (5000ms)
- **Erreur** : 7 secondes (7000ms)
- **Avertissement** : 6 secondes (6000ms)
- **Information** : 5 secondes (5000ms)

### Thème
Les notifications s'adaptent automatiquement au thème de l'application (clair/sombre) grâce à la configuration dans `app.component.html`.

## Bonnes Pratiques

1. **Messages Clairs** : Utilisez des titres courts et des messages descriptifs
2. **Durée Appropriée** : Laissez suffisamment de temps pour lire les messages importants
3. **Feedback Immédiat** : Affichez des notifications de chargement pour les opérations longues
4. **Gestion d'Erreur** : Toujours informer l'utilisateur en cas d'erreur
5. **Cohérence** : Utilisez les mêmes types de notifications pour les mêmes types d'actions

## Intégration avec les Composants Existants

Le système est déjà intégré dans :
- **SignInComponent** : Notifications de connexion réussie/échouée
- **DashboardComponent** : Notification de bienvenue et exemples de test

Pour ajouter des notifications à un nouveau composant, suivez simplement les exemples ci-dessus. 