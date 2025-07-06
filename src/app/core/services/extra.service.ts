import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Extra {
  idExtra: number;
  libelle: string;
}

@Injectable({ providedIn: 'root' })
export class ExtraService {
  private apiUrl: string = 'http://localhost:8081/api/extra';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Extra[]> {
    return this.http.get<Extra[]>(`${this.apiUrl}/all`);
  }

  create(extra: Extra): Observable<Extra> {
    return this.http.post<Extra>(`${this.apiUrl}/add`, extra);
  }

  update(id: number, extra: Extra): Observable<Extra> {
    return this.http.put<Extra>(`${this.apiUrl}/update/${id}`, extra);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}