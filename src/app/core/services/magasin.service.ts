import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MagasinService {
  private api: string = 'http://localhost:8080/api/magasin';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.api+'/all');
  }

  create(body: any): Observable<any> {
    return this.http.post(this.api+'/add', body);
  }

  update(id: string, body: any): Observable<any> {
    return this.http.put(this.api + '/update' + id, body);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(this.api + '/delete' + id);
  }
}
