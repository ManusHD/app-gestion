import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';

@Injectable()
export class ProductoService {
  private apiUrl = 'http://localhost:8091/productos';

  constructor(private http: HttpClient) {}

  getProductoPorReferencia(referencia: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/referencia/${referencia}`);
  }
}
