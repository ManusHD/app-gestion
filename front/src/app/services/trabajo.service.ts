import { Injectable } from "@angular/core";
import { Trabajo } from "../models/trabajo.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { environment } from '../../environments/environment-dev';

@Injectable()
export class TrabajoService {
  private apiUrl = environment.apiTrabajos; // Usar la URL del environment

  constructor(private httpClient: HttpClient, private router: Router) {}

  getTrabajosPaginado(page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getTrabajosByEstadoPaginado(estado: boolean, page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/estado/${estado}/paginado?page=${page}&size=${size}`);
  }

  getTrabajosByEstado(estado: boolean): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/estado/${estado}`);
  }

  getFiltradasTrabajosPaginadas(fechaInicio: string, fechaFin: string, tipoBusqueda: string, texto: string, page: number, size: number): Observable<any> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('tipoBusqueda', tipoBusqueda);
    
    if (texto && texto.trim() !== '') {
      params = params.set('textoBusqueda', texto);
    }
    
    return this.httpClient.get<any>(`${this.apiUrl}/filtrar/paginado?page=${page}&size=${size}`, { params });
  }

  getFiltradasTrabajos(fechaInicio: string, fechaFin: string, tipoBusqueda: string, texto: string): Observable<Trabajo[]> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('tipoBusqueda', tipoBusqueda);
    
    if (texto && texto.trim() !== '') {
      params = params.set('textoBusqueda', texto);
    }
    
    return this.httpClient.get<Trabajo[]>(`${this.apiUrl}/filtrar`, { params });
  }

  marcarComoRealizado(id: number): Observable<Trabajo> {
    return this.httpClient.put<Trabajo>(`${this.apiUrl}/${id}/realizar`, null);
  }

  updateTrabajo(trabajo: Trabajo): Observable<Trabajo> {
    return this.httpClient.put<Trabajo>(`${this.apiUrl}/${trabajo.id}`, trabajo);
  }

  newTrabajo(trabajo: Trabajo): Observable<Trabajo> {
    console.log("Trabajo enviado", trabajo);
    return this.httpClient.post<Trabajo>(`${this.apiUrl}`, trabajo);
  }

  deleteTrabajo(idTrabajo: number): Observable<Trabajo> {
    return this.httpClient.delete<Trabajo>(`${this.apiUrl}/${idTrabajo}`);
  }
}