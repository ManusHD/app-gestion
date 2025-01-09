import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';

@Injectable()
export class ProductoServices {
  private apiUrl = 'http://localhost:8091/productos';

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}`);
  }

  getProductosOrdenadosPorReferencia(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/byReferencia`);
  }

  getProductoPorReferencia(referencia: String): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/referencia/${referencia}`);
  }

  postProducto(producto: Producto): Observable<Producto> {
    producto.stock = 0;
    return this.http.post<Producto>(`${this.apiUrl}`, producto);
  }
  
}
