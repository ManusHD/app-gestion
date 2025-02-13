import { Injectable } from '@angular/core';
import { Salida } from '../models/salida.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';

@Injectable()
export class SalidaServices {
  private apiUrl = 'http://localhost:8093/salidas';

  constructor(private httpClient: HttpClient, private router: Router) {}

  getSalidas(): Observable<Salida[]> {
    return this.httpClient.get<Salida[]>(`${this.apiUrl}`);
  }

  getSalidasByEstado(estado: boolean): Observable<Salida[]> {
    return this.httpClient.get<Salida[]>(`${this.apiUrl}/estado/${estado}`);
  }

  setEnviada(id: number): Observable<Salida> {
    console.log("Envio: " + id);
    return this.httpClient.put<Salida>(`${this.apiUrl}/${id}/enviar`, null);
  }

  updateSalida(salida: Salida): Observable<Salida> {
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
