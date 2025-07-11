import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class DeviseService{
    private api : string ='http://localhost:8081/api/devise';
    

  constructor(private readonly http: HttpClient) {}
  getAll(): Observable<any> {
    return this.http.get(this.api+'/all');
  }

  create(body: any): Observable<any> {
    return this.http.post(this.api+'/add', body);
  }

  update(id: string, body: any): Observable<any> {
    return this.http.put(this.api + '/update/' + id, body);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(this.api + '/delete/' + id);
  }

  closeMagasinAlert(): void {
    this.showMagasinAlert = false;
  }

  closeLoadingAlert(): void {
    this.showLoadingAlert = false;
  }

  closeNoStockAlert(): void {
    this.showNoStockAlert = false;
  }

  // Popups d'alerte
  showMagasinAlert = false;
  showLoadingAlert = false;
  showNoStockAlert = false;




}