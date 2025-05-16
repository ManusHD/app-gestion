import { Injectable } from '@angular/core';
import { Salida } from '../models/salida.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import { environment } from '../../environments/environment-dev';

@Injectable()
export class SalidaServices {
  private apiUrl =  environment.apiSalidas;

  constructor(private httpClient: HttpClient, private router: Router) {}

  getSalidas(page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getSalidasByEstado(estado: boolean): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/estado/${estado}`);
  }

  getSalidasByEstadoPaginado(estado: boolean, page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/estado/${estado}/paginado?page=${page}&size=${size}`);
  }

  getSalidasByEstadoRellenaPaginado(estado: boolean, rellena: boolean, page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/estado/${estado}/rellena/${rellena}/paginado?page=${page}&size=${size}`);
  }
  
  getFiltradasSalidasPaginadas(fechaInicio: string, fechaFin: string, tipoBusqueda: string, texto: string, page: number, size: number): Observable<any> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('tipoBusqueda', tipoBusqueda);
    
    if (texto && texto.trim() !== '') {
      params = params.set('textoBusqueda', texto);
    }

    console.log(tipoBusqueda);
    
    return this.httpClient.get<any>(`${this.apiUrl}/filtrar/paginado?page=${page}&size=${size}`, { params });
  }
  
  getFiltradasSalidas(fechaInicio: string, fechaFin: string, tipoBusqueda: string, texto: string): Observable<any> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('tipoBusqueda', tipoBusqueda);
    
    if (texto && texto.trim() !== '') {
      params = params.set('textoBusqueda', texto);
    }

    console.log(tipoBusqueda);
    
    return this.httpClient.get<any>(`${this.apiUrl}/filtrar`, { params });
  }

  setEnviada(id: number): Observable<Salida> {
    return this.httpClient.put<Salida>(`${this.apiUrl}/${id}/enviar`, null);
  }

  updateSalida(salida: Salida): Observable<Salida> {
    console.log("Salida enviada: " + salida);
    return this.httpClient.put<Salida>(`${this.apiUrl}/${salida.id}`, salida);
  }

  newSalida(salida: Salida): Observable<Salida> {
    console.log('Salida enviada');
    console.log(salida);
    return this.httpClient.post<Salida>(`${this.apiUrl}`, salida);
  }

  deleteSalida(id: number): Observable<Salida> {
    return this.httpClient.delete<Salida>(`${this.apiUrl}/${id}`);
  }
}
