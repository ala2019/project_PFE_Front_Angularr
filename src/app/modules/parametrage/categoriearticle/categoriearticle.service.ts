import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class CategorieArticleService {
  constructor(private readonly http: HttpClient) {}

  getcategorie(): Observable<any> {
    return this.http.get(environment.BaseApi + '/categorie/all');
  }

  deletecategorie(id: any): Observable<any> {
    return this.http.delete(environment.BaseApi + '/categorie/delete/' + id);
  }

  addcategorie(categorie: any): Observable<any> {
    return this.http.post<any>(environment.BaseApi + '/categorie/add', categorie);
  }

  updatecategorie(id: any, data: any) {
    return this.http.put(environment.BaseApi + '/categorie/update/' + id, data);
  }
}
