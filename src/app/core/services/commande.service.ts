import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';



@Injectable({ providedIn: 'root' })
export class CommandeService {
  private baseUrl = 'http://localhost:8081/api/cmd';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  create(cmd: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, cmd);
  }

  update(id: number, cmd: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, cmd);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
    
  }
}
