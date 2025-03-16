import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ubicacion } from '../models/ubicacion.model';
import { ReubicacionRequest } from '../models/ReubicacionRequest.model';
import { environment } from '../../environments/environment-dev';

@Injectable()
export class UbicacionService {
  private apiUrl =  environment.apiUbicaciones;

  constructor(private httpClient: HttpClient) {}

  getUbicacionesOrderByNombrePaginadas(page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/paginadas?page=${page}&size=${size}`);
  }

  getUbicacionesOrderByNombre(): Observable<Ubicacion[]> {
    return this.httpClient.get<Ubicacion[]>(`${this.apiUrl}`);
  }

  getUbicacionByNombre(nombre: String): Observable<Ubicacion> {
    return this.httpClient.get<Ubicacion>(`${this.apiUrl}/nombre/${nombre}`);
  }

  getUbicacionesByNombre(nombre: String): Observable<Ubicacion[]> {
    return this.httpClient.get<Ubicacion[]>(`${this.apiUrl}/nombre/${nombre}/coincidentes`);
  }

  getUbicacionesByNombrePaginado(nombre: String, page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/nombre/${nombre}/coincidentes/paginado?page=${page}&size=${size}`);
  }

  getUbicacionesByReferenciaProducto(referenciaProducto: String): Observable<Ubicacion[]> {
    return this.httpClient.get<Ubicacion[]>(`${this.apiUrl}/referenciaProducto/${referenciaProducto}`);
  }

  getUbicacionesByReferenciaProductoPaginado(referenciaProducto: String, page: number, size: number ): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/referenciaProducto/${referenciaProducto}/paginado?page=${page}&size=${size}`);
  }

  getUbicacionesByDescripcionProducto(descripcionProducto: String): Observable<Ubicacion[]> {
    return this.httpClient.get<Ubicacion[]>(`${this.apiUrl}/descripcionProducto/${descripcionProducto}`);
  }

  getUbicacionesByDescripcionProductoPaginado(descripcionProducto: String, page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/descripcionProducto/${descripcionProducto}/paginado?page=${page}&size=${size}`);
  }

  newUbicacion(ubicacion: Ubicacion): Observable<Ubicacion> {
    return this.httpClient.post(`${this.apiUrl}`, ubicacion);
  }

  reubicar(reubicacion: ReubicacionRequest): Observable<String> {
    console.log("Reubicación Enviada", reubicacion);
    return this.httpClient.post(`${this.apiUrl}/reubicar`, reubicacion, { responseType: 'text' });
  }

  updateUbicacion(id: number, ubicacion: Ubicacion): Observable<Ubicacion> {
    return this.httpClient.put<Ubicacion>(`${this.apiUrl}/${id}`, ubicacion);
  }

  deleteUbicacion(id: number): Observable<Ubicacion> {
    return this.httpClient.delete(`${this.apiUrl}/${id}`);
  }
}
