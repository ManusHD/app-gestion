import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import { environment } from '../../environments/environment-dev';

@Injectable()
export class ProductoServices {
  private apiUrl =  environment.apiProductos;

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}`);
  }

  getProductosPaginado(page: number, size: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/byReferencia?page=${page}&size=${size}`);
  }

  getProductoPorReferencia(referencia: String): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/referencia/${referencia}`);
  }

  getVisualesPaginado(page: number, size: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/visuales?page=${page}&size=${size}`);
  }

  getVisualesPorDescripcionPaginado(descripcion: string, page: number, size: number): Observable<any> {
    console.log(`${this.apiUrl}/visuales/descripcion/${descripcion}?page=${page}&size=${size}`)
    return this.http.get<any>(`${this.apiUrl}/visuales/descripcion/${descripcion}?page=${page}&size=${size}`);
  }

  getProductosSinReferenciaPaginado(page: number, size: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/sinreferencia?page=${page}&size=${size}`);
  }

  getProductosSinReferenciaPorDescripcionPaginado(description: string, page: number, size: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/sinreferencia/descripcion/${description}?page=${page}&size=${size}`);
  }

  getProductosPorDescripcionPaginado(descripcion: String, page: number, size: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/description/${descripcion}/paginado?page=${page}&size=${size}`);
  }

  getProductosPorReferenciaPaginado(referencia: String, page: number, size: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/referencia/${referencia}/buscar/paginado?page=${page}&size=${size}`);
  }

  // getVisualesPaginado(page: number, size: number): Observable<any> {
  //   return this.http.get<any>(`${this.apiUrl}/visuales?page=${page}&size=${size}`);
  // }

  // getVisualesPorDescripcionPaginado(descripcion: string, page: number, size: number): Observable<any> {
  //   console.log(`${this.apiUrl}/visuales/descripcion/${descripcion}?page=${page}&size=${size}`)
  //   return this.http.get<any>(`${this.apiUrl}/visuales/descripcion/${descripcion}?page=${page}&size=${size}`);
  // }

  // getProductosSinReferenciaPaginado(page: number, size: number): Observable<any> {
  //   return this.http.get<any>(`${this.apiUrl}/sinreferencia?page=${page}&size=${size}`);
  // }

  // getProductosSinReferenciaPorDescripcionPaginado(descripcion: string): Observable<any> {
  //   return this.http.get<any>(`${this.apiUrl}/sinreferencia/descripcion/${descripcion}`);
  // }

  getProductosPorDescripcion(descripcion: String): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/description/${descripcion}`);
  }

  getProductosPorReferencia(referencia: String): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/referencia/${referencia}/buscar`);
  }

  postProducto(producto: Producto): Observable<Producto> {
    producto.stock = 0;
    return this.http.post<Producto>(`${this.apiUrl}`, producto);
  }

  putProducto(id: number, producto: Producto): Observable<Producto> {
    console.log(producto.description);
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, producto.description);
  }

  deleteProducto(id: number): Observable<Producto> {
    return this.http.delete<Producto>(`${this.apiUrl}/${id}`);
  }
}
