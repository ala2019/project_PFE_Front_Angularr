import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mouvement, MouvementFilter } from '../models/mouvement.model';

@Injectable({ providedIn: 'root' })
export class MouvementService {
  private apiUrl = 'http://localhost:8081/api/mvt'; 

  constructor(private http: HttpClient) {}

  getAll(): Observable<Mouvement[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }
/*
  getById(id: number): Observable<Mouvement> {
    return this.http.get<Mouvement>(`${this.baseUrl}/${id}`);
  }

  create(mouvement: Mouvement): Observable<Mouvement> {
    return this.http.post<Mouvement>(this.baseUrl, mouvement);
  }

  update(id: number, mouvement: Mouvement): Observable<Mouvement> {
    return this.http.put<Mouvement>(`${this.baseUrl}/${id}`, mouvement);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  filter(filters: MouvementFilter): Observable<Mouvement[]> {
    return this.http.post<Mouvement[]>(`${this.baseUrl}/filter`, filters);
  }

  // Méthodes spécifiques pour les différents types de mouvements
  createPointage(mouvement: Mouvement): Observable<Mouvement> {
    return this.http.post<Mouvement>(`${this.baseUrl}/pointage`, mouvement);
  }

  createTransfert(mouvement: Mouvement): Observable<Mouvement> {
    return this.http.post<Mouvement>(`${this.baseUrl}/transfert`, mouvement);
  }
*/
  // Générer les mouvements automatiquement depuis les commandes
  generateFromCommande(commandeId: number, typeCommande: 'VENTE' | 'TRANSFERT'): Observable<Mouvement[]> {
    return this.http.post<Mouvement[]>(`${this.apiUrl}/generate-from-commande`, {
      commandeId,
      typeCommande
    });
  }
} 