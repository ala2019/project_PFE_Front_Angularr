import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FournisseurClientService {
  private apiUrl = 'http://localhost:8081/api/personne';

  constructor(private http: HttpClient) {}

  getPersonnes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  addPersonne(personne: any): Observable<any> {
    const dataToSend = {
      codeClient: personne.codeClient,
      nomPersonne: personne.nomPersonne,
      telephone: personne.telephone || '',
      email: personne.email || '',
      adresse: personne.adresse || '',
      devise: personne.devise ? { idDevise: personne.devise } : null,
      type: personne.type || 'CLIENT'
    };
    
    return this.http.post<any>(`${this.apiUrl}/add`, dataToSend);
  }

  updatePersonne(id: number, personne: any): Observable<any> {
    const dataToSend = {
      idPersonne: id,
      codeClient: personne.codeClient,
      nomPersonne: personne.nomPersonne,
      telephone: personne.telephone || '',
      email: personne.email || '',
      adresse: personne.adresse || '',
      devise: personne.devise ? { idDevise: personne.devise } : null,
      type: personne.type || 'CLIENT'
    };
    
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, dataToSend);
  }

  deletePersonne(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  // Méthodes de compatibilité pour maintenir l'existant
  getAll(): Observable<any[]> {
    return this.getPersonnes();
  }

  create(body: any): Observable<any> {
    return this.addPersonne(body);
  }

  update(id: string, body: any): Observable<any> {
    return this.updatePersonne(Number(id), body);
  }

  delete(id: string): Observable<any> {
    return this.deletePersonne(Number(id));
  }
}
