import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategorieArticleService {
  private apiUrl = 'http://localhost:8080/apis/categories'; // à adapter selon ton backend

  constructor(private http: HttpClient) {}

  getcategorie(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  addCategorie(categorie: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, categorie);
  }

  updateCategorie(id: number, categorie: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, categorie);
  }

  deleteCategorie(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
