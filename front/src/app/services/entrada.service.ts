import { Injectable } from "@angular/core";
import { Entrada } from "../models/entrada.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Router } from "@angular/router";
import { from, Observable } from "rxjs";
import { environment } from '../../environments/environment-dev';


@Injectable()
export class EntradaServices {
  private apiUrl =  environment.apiEntradas;

  constructor(private httpClient: HttpClient, private router: Router) {}

  getEntradasPaginado(page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getEntradasByEstadoPaginado(estado: boolean, page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/estado/${estado}/paginado?page=${page}&size=${size}`);
  }

  getEntradasByEstado(estado: boolean): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/estado/${estado}`);
  }

  getFiltradasEntradasPaginadas(fechaInicio: string, fechaFin: string, tipoBusqueda: string, texto: string, page: number, size: number): Observable<any> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('tipoBusqueda', tipoBusqueda);
    
    if (texto && texto.trim() !== '') {
      params = params.set('textoBusqueda', texto);
    }
    
    return this.httpClient.get<any>(`${this.apiUrl}/filtrar/paginado?page=${page}&size=${size}`, { params });
  }

  getFiltradasEntradas(fechaInicio: string, fechaFin: string, tipoBusqueda: string, texto: string): Observable<Entrada[]> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('tipoBusqueda', tipoBusqueda);
    
    if (texto && texto.trim() !== '') {
      params = params.set('textoBusqueda', texto);
    }
    
    return this.httpClient.get<Entrada[]>(`${this.apiUrl}/filtrar`, { params });
  }

  setRecibida(id: number): Observable<Entrada> {
    return this.httpClient.put<Entrada>(`${this.apiUrl}/${id}/recibir`, null);
  }

  updateEntrada(entrada: Entrada): Observable<Entrada> {
    return this.httpClient.put<Entrada>(`${this.apiUrl}/${entrada.id}`, entrada);
  }

  newEntrada(entrada: Entrada): Observable<Entrada> {
    console.log("Entrada enviada");
    console.log(entrada);
    return this.httpClient.post<Entrada>(`${this.apiUrl}`, entrada);
  }

  deleteEntrada(idEntrada: number): Observable<Entrada> {
    return this.httpClient.delete<Entrada>(`${this.apiUrl}/${idEntrada}`);
  }

}
