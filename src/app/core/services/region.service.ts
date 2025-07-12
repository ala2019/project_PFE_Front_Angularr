import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RegionService {
  private apiUrl: string = 'http://localhost:8081/api/region';

  constructor(private  http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  create(region: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add`, region);
  }

  update(id: number, region: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${id}`, region);
  }

  delete(id: number): Observable<any> {
    //return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { responseType: 'text' });

  }
}
