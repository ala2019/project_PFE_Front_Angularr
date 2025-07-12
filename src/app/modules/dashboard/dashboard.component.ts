import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    imports: [RouterOutlet]
})
export class DashboardComponent implements OnInit {
  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Exemple de notification de bienvenue
  }

  // Exemple de méthodes pour tester les différents types de notifications
  showSuccessNotification(): void {
    this.notificationService.success(
      'Opération réussie !',
      'L\'action a été effectuée avec succès.'
    );
  }

  showErrorNotification(): void {
    this.notificationService.error(
      'Erreur !',
      'Une erreur s\'est produite lors de l\'opération.'
    );
  }

  showWarningNotification(): void {
    this.notificationService.warning(
      'Attention !',
      'Veuillez vérifier les informations saisies.'
    );
  }

  showInfoNotification(): void {
    this.notificationService.info(
      'Information',
      'Voici une information importante pour vous.'
    );
  }

  showLoadingNotification(): void {
    const loadingId = this.notificationService.loading(
      'Chargement en cours...',
      'Veuillez patienter pendant le traitement.'
    );
    
    // Simuler un traitement
    setTimeout(() => {
      this.notificationService.dismiss(loadingId);
      this.notificationService.success(
        'Traitement terminé !',
        'L\'opération a été effectuée avec succès.'
      );
    }, 3000);
  }
}
