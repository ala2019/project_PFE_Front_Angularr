import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() {}

  // Méthodes pour ajouter des notifications
  success(title: string, message?: string, duration: number = 5000): void {
    toast.success(title, {
      description: message,
      duration: duration,
      position: 'top-right'
    });
  }

  error(title: string, message?: string, duration: number = 7000): void {
    toast.error(title, {
      description: message,
      duration: duration,
      position: 'top-right'
    });
  }

  warning(title: string, message?: string, duration: number = 6000): void {
    toast.warning(title, {
      description: message,
      duration: duration,
      position: 'top-right'
    });
  }

  info(title: string, message?: string, duration: number = 5000): void {
    toast.info(title, {
      description: message,
      duration: duration,
      position: 'top-right'
    });
  }

  // Méthode pour les notifications personnalisées
  custom(title: string, message?: string, options?: any): void {
    toast(title, {
      description: message,
      ...options
    });
  }

  // Méthode pour les notifications de chargement
  loading(title: string, message?: string): string | number {
    return toast.loading(title, {
      description: message,
      position: 'top-right'
    });
  }

  // Méthode pour supprimer une notification
  dismiss(id: string | number): void {
    toast.dismiss(id);
  }

  // Méthode pour supprimer toutes les notifications
  dismissAll(): void {
    toast.dismiss();
  }
} 