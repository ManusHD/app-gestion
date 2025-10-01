import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mueble } from '../models/mueble.model';
import { environment } from '../../environments/environment-dev';

@Injectable()
export class MuebleService {
  private apiUrl = environment.apiMuebles;

  constructor(private httpClient: HttpClient) {}

  getMueblesPaginado(page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getMueblesByEstadoPaginado(estado: boolean, page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/estado/${estado}/paginado?page=${page}&size=${size}`);
  }

  getMueblesByEstado(estado: boolean): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/estado/${estado}`);
  }

  getFiltradasMueblesPaginadas(fechaInicio: string, fechaFin: string, tipoBusqueda: string, texto: string, page: number, size: number): Observable<any> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('tipoBusqueda', tipoBusqueda);
    
    if (texto && texto.trim() !== '') {
      params = params.set('textoBusqueda', texto);
    }
    
    return this.httpClient.get<any>(`${this.apiUrl}/filtrar/paginado?page=${page}&size=${size}`, { params });
  }

  getFiltradasMuebles(fechaInicio: string, fechaFin: string, tipoBusqueda: string, texto: string): Observable<Mueble[]> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('tipoBusqueda', tipoBusqueda);
    
    if (texto && texto.trim() !== '') {
      params = params.set('textoBusqueda', texto);
    }
    
    return this.httpClient.get<Mueble[]>(`${this.apiUrl}/filtrar`, { params });
  }

  marcarComoRealizado(id: number): Observable<Mueble> {
    return this.httpClient.put<Mueble>(`${this.apiUrl}/${id}/realizar`, null);
  }

  updateMueble(mueble: Mueble): Observable<Mueble> {
    console.log("Mueble enviado:", mueble)
    return this.httpClient.put<Mueble>(`${this.apiUrl}/${mueble.id}`, mueble);
  }

  newMueble(mueble: Mueble): Observable<Mueble> {
    console.log("Trabajo de mueble enviado", mueble);
    return this.httpClient.post<Mueble>(`${this.apiUrl}`, mueble);
  }

  deleteMueble(idMueble: number): Observable<Mueble> {
    return this.httpClient.delete<Mueble>(`${this.apiUrl}/${idMueble}`);
  }
}