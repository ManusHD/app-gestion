import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ubicacion } from '../models/ubicacion.model';
import { ReubicacionRequest } from '../models/ReubicacionRequest.model';
import { environment } from '../../environments/environment-dev';
import { TransferirEstadoUbicacionDTO } from '../models/TransferirEstadoUbicacionDTO';

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

  getUbicacionesByEstado(estado: string): Observable<Ubicacion[]> {
    return this.httpClient.get<Ubicacion[]>(`${this.apiUrl}/estado/${estado}`);
  }

  getUbicacionesByEstadoPaginado(estado: string, page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/estado/${estado}/paginado?page=${page}&size=${size}`);
  }

  // Métodos para búsqueda por referencia y estado
  getUbicacionesByReferenciaAndEstado(referencia: string, estado: string): Observable<Ubicacion[]> {
    return this.httpClient.get<Ubicacion[]>(`${this.apiUrl}/referencia/${referencia}/estado/${estado}`);
  }

  getUbicacionesByReferenciaAndEstadoPaginado(referencia: string, estado: string, page: number, size: number): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/referencia/${referencia}/estado/${estado}/paginado?page=${page}&size=${size}`);
  }

  // Método para transferir estado en ubicación
  transferirEstadoEnUbicacion(dto: TransferirEstadoUbicacionDTO): Observable<string> {
    const dtoLimpio = {
      ubicacionNombre: dto.ubicacionNombre,
      referencia: dto.referencia,
      estadoOrigen: dto.estadoOrigen,
      estadoDestino: dto.estadoDestino,
      cantidad: dto.cantidad
    };
    
    console.log('DTO enviado (sin token):', dtoLimpio);
    return this.httpClient.put(`${this.apiUrl}/transferir-estado`, dtoLimpio, {responseType: 'text'});
  }

  // Método para eliminar grupo de productos en ubicaciones
  eliminarGrupoProductosEnUbicaciones(referencia: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.apiUrl}/productos/grupo/${referencia}`);
  }
}
