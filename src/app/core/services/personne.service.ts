import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PersonneService {
 private apiUrl = 'http://localhost:8081/api/personne'; 

  constructor(private  http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  create(personne: any): Observable<any> {
    const dataToSend = {
      codePersonne: personne.codePersonne,
      nomPersonne: personne.nomPersonne,
      telephone: personne.telephone || '',
      email: personne.email || '',
      adresse: personne.adresse || '',
      ribBancaire: personne.ribBancaire || '',
      devise: personne.devise ? { idDevise: personne.devise } : null,
      type: personne.type || 'CLIENT'
    };
    
    return this.http.post<any>(`${this.apiUrl}/add`, dataToSend);
  }

  update(id: number, personne: any): Observable<any> {
    const dataToSend = {
      codePersonne: personne.codePersonne,
      nomPersonne: personne.nomPersonne,
      telephone: personne.telephone || '',
      email: personne.email || '',
      adresse: personne.adresse || '',
      ribBancaire: personne.ribBancaire || '',
      devise: personne.devise ? { idDevise: personne.devise } : null,
      type: personne.type || 'CLIENT'
    };
    
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, dataToSend);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}
