import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StockService {
  private apiUrl: string = 'http://localhost:8081/api/stock';

  constructor(private http: HttpClient) {}

  // Récupérer le stock par magasin
  getStockByMagasin(idMagasin: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/magasin/${idMagasin}`);
  }

  // Récupérer tous les magasins
  getMagasins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/magasins`);
  }

  // Récupérer les devises
  getDevises(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/devises`);
  }

  // Récupérer le stock d'un article spécifique
  getStockArticle(idArticle: number, idMagasin: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/article/${idArticle}/magasin/${idMagasin}`);
  }

  // Récupérer les statistiques de stock pour un magasin
  getStockStats(idMagasin: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats/magasin/${idMagasin}`);
  }

  // Rechercher des articles en stock
  searchStock(idMagasin: number, searchTerm: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search/magasin/${idMagasin}?q=${searchTerm}`);
  }
}