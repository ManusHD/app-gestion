import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AgenciaTransporte } from '../models/agencia-transporte.model';
import { Observable } from 'rxjs';

@Injectable()
export class AgenciasTransporteService {
  private apiUrl: string = 'http://localhost:8096/agenciasEnvio';

  constructor(private http: HttpClient) {}

  getAgenciasTransporte(): Observable<AgenciaTransporte[]> {
    return this.http.get<AgenciaTransporte[]>(this.apiUrl);
  }

  getAgenciasOrderByNombre(): Observable<AgenciaTransporte[]> {
    return this.http.get<AgenciaTransporte[]>(`${this.apiUrl}/byNombre`);
  }

  getAgenciaTransporteByNombre(nombre: string): Observable<AgenciaTransporte> {
    return this.http.get<AgenciaTransporte>(`${this.apiUrl}/nombre/${nombre}`);
  }

  updateAgenciaTransporte(
    agencia: AgenciaTransporte
  ): Observable<AgenciaTransporte> {
    return this.http.put<AgenciaTransporte>(this.apiUrl, agencia);
  }

  newAgenciaTransporte(
    agencia: AgenciaTransporte
  ): Observable<AgenciaTransporte> {
    return this.http.post<AgenciaTransporte>(this.apiUrl, agencia);
  }

  deleteAgenciaTransporte(id: number): Observable<AgenciaTransporte> {
    return this.http.delete<AgenciaTransporte>(`${this.apiUrl}/${id}`);
  }
}
