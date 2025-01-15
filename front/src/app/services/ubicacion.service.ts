import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ubicacion } from '../models/ubicacion.model';

@Injectable()
export class UbicacionService {
  private apiUrl = 'http://localhost:8095/ubicaciones';

  constructor(private httpClient: HttpClient) {}

  getUbicaciones(): Observable<Ubicacion[]> {
    return this.httpClient.get<Ubicacion[]>(`${this.apiUrl}`);
  }

  getUbicacionesOrderByNombre(): Observable<Ubicacion[]> {
    return this.httpClient.get<Ubicacion[]>(`${this.apiUrl}/byNombre`);
  }

  getUbicacionByNombre(nombre: String): Observable<Ubicacion[]> {
    return this.httpClient.get<Ubicacion[]>(`${this.apiUrl}/nombre/${nombre}`);
  }
}
