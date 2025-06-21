import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategorieArticleService {
  private apiUrl = 'http://localhost:8081/api/categorie'; // à adapter selon ton backend

  constructor(private http: HttpClient) {}

  getcategorie(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  addCategorie(categorie: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add`, categorie);
  }

  updateCategorie(id: number, categorie: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, categorie);
  }

  deleteCategorie(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}
