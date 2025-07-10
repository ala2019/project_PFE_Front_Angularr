import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FactureData {
  idFacture?: number;
  numFacture: string;
  datefacture: string;
  totalTTC: number;
  totalHT: number;
  totalTva: number;
  commandes: number[];
  clientId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  private apiUrl = 'http://localhost:8081/api/fact';

  constructor(private http: HttpClient) {}

  // Générer une facture à partir des commandes sélectionnées
  genererFacture(factureData: FactureData): Observable<FactureData> {
    return this.http.post<FactureData>(`${this.apiUrl}/generer`, factureData);
  }

  // Récupérer toutes les factures
  getAll(): Observable<FactureData[]> {
    return this.http.get<FactureData[]>(`${this.apiUrl}/all`);
  }

  // Récupérer une facture par ID
  getById(id: number): Observable<FactureData> {
    return this.http.get<FactureData>(`${this.apiUrl}/${id}`);
  }

  // Supprimer une facture
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 