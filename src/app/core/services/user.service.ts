import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:8081/api/user';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  create(user: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add`, user);
  }

  update(id: number, user: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, user);
  }

  delete(id: number): Observable<any> {
    const headers = new HttpHeaders().set('Accept', 'text/plain');
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { 
      headers: headers,
      responseType: 'text'
    });
  }
}
