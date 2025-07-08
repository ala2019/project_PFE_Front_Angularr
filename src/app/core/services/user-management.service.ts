import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private api: string = 'http://localhost:8081/api/user';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.api+'/all');
  }

  create(body: any): Observable<any> {
    return this.http.post(this.api+'/add', body);
  }

  update(id: number, body: any): Observable<any> {
    return this.http.put(this.api + '/update/' + id, body);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(this.api + '/delete/' + id);
  }
} 