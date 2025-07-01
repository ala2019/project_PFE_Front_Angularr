import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';



@Injectable({ providedIn: 'root' })
export class CommandeService {
 private apiUrl = 'http://localhost:8081/api/cmd';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  
  create(cmd: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add`, {...cmd});
  }

  update(id: any, cmd: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, cmd);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
    
  }
}
