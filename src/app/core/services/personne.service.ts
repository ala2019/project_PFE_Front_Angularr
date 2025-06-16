import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PersonneService {
  private api: string = 'http://localhost:8080/api/personne';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.api);
  }

  create(body: any): Observable<any> {
    return this.http.post(this.api, body);
  }

  update(id: string, body: any): Observable<any> {
    return this.http.put(this.api + '/' + id, body);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(this.api + '/' + id);
  }
}
