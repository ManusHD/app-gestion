import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment-dev';
import { PlantillaCorreo } from '../models/plantilla-correo.model';
import { HistorialCorreo } from '../models/historial-correo.model';
import { EnviarCorreoRequest } from '../models/enviar-correo-request.model';

@Injectable({
  providedIn: 'root'
})
export class CorreoService {
  private apiUrlPlantillas = environment.apiCorreos + '/plantillas-correo';
  private apiUrlCorreos = environment.apiCorreos + '/correos';

  constructor(private http: HttpClient) {}

  // ========== PLANTILLAS ==========
  getPlantillas(page: number, size: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlPlantillas}?page=${page}&size=${size}`);
  }

  getPlantillasActivas(): Observable<PlantillaCorreo[]> {
    return this.http.get<PlantillaCorreo[]>(`${this.apiUrlPlantillas}/activas`);
  }

  getPlantillaById(id: number): Observable<PlantillaCorreo> {
    return this.http.get<PlantillaCorreo>(`${this.apiUrlPlantillas}/${id}`);
  }

  getPlantillaByAlias(alias: string): Observable<PlantillaCorreo> {
    return this.http.get<PlantillaCorreo>(`${this.apiUrlPlantillas}/alias/${alias}`);
  }

  buscarPlantillas(alias: string, page: number, size: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrlPlantillas}/buscar?alias=${alias}&page=${page}&size=${size}`
    );
  }

  crearPlantilla(plantilla: PlantillaCorreo): Observable<PlantillaCorreo> {
    return this.http.post<PlantillaCorreo>(this.apiUrlPlantillas, plantilla);
  }

  actualizarPlantilla(id: number, plantilla: PlantillaCorreo): Observable<PlantillaCorreo> {
    return this.http.put<PlantillaCorreo>(`${this.apiUrlPlantillas}/${id}`, plantilla);
  }

  eliminarPlantilla(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrlPlantillas}/${id}`);
  }

  // ========== ENVÍO DE CORREOS ==========
  enviarCorreo(request: EnviarCorreoRequest): Observable<string> {
    return this.http.post(`${this.apiUrlCorreos}/enviar`, request, { responseType: 'text' });
  }

  // ========== HISTORIAL ==========
  getHistorial(page: number, size: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlCorreos}/historial?page=${page}&size=${size}`);
  }

  getHistorialBySalida(salidaId: number): Observable<HistorialCorreo[]> {
    return this.http.get<HistorialCorreo[]>(`${this.apiUrlCorreos}/historial/salida/${salidaId}`);
  }

  buscarHistorial(destinatario: string, page: number, size: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrlCorreos}/historial/buscar?destinatario=${destinatario}&page=${page}&size=${size}`
    );
  }

  filtrarHistorial(inicio: string, fin: string, page: number, size: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrlCorreos}/historial/filtrar?inicio=${inicio}&fin=${fin}&page=${page}&size=${size}`
    );
  }
}