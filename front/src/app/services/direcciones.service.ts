import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Colaborador } from "../models/colaborador.model";
import { PDV } from "../models/pdv.model";
import { Perfumeria } from "../models/perfumeria.model";
import { OtraDireccion } from "../models/otraDireccion.model";
import { environment } from '../../environments/environment-dev';

@Injectable()
export class DireccionesService {
    private apiUrlColaboradores = environment.apiDirecciones + '/colaboradores';
    private apiUrlPdvs = environment.apiDirecciones + '/pdvs';
    private apiUrlPerfumerias = environment.apiDirecciones + '/perfumerias';
    private apiUrlOtrasDirecciones = environment.apiDirecciones + '/otrasDirecciones';

    constructor(private http: HttpClient) {}

    getColaboradoresActivos(): Observable<any> {
        return this.http.get<any>(`${this.apiUrlColaboradores}/activos`);
    }

    getColaboradoresPaginado(page: number, size: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrlColaboradores}/paginado?page=${page}&size=${size}`);
    }

    getColaboradoresByNombrePaginado(nombre: string, page: number, size: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrlColaboradores}/byNombre/${nombre}/paginado?page=${page}&size=${size}`);
    }

    getColaborador(nombre: String): Observable<Colaborador> {
        return this.http.get(`${this.apiUrlColaboradores}/${nombre}`);
    }

    createColaborador(colaborador: Colaborador): Observable<Colaborador> {
        return this.http.post(`${this.apiUrlColaboradores}`, colaborador);
    }

    updateColaborador(id: number, colaborador: Colaborador): Observable<Colaborador> {
        return this.http.put(`${this.apiUrlColaboradores}/${id}`, colaborador);
    }

    deleteColaborador(id: number): Observable<Colaborador> {
        return this.http.delete(`${this.apiUrlColaboradores}/${id}`);
    }

    getPdvs(): Observable<any> {
        return this.http.get<any>(`${this.apiUrlPdvs}`);
    }

    getPdvsPaginado(page: number, size: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrlPdvs}/paginado?page=${page}&size=${size}`);
    }

    getPdvsByNombrePaginado(nombre: string, page: number, size: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrlPdvs}/byNombre/${nombre}/paginado?page=${page}&size=${size}`);
    }
    
    getPdv(nombre: string): Observable<PDV> {
        return this.http.get<PDV>(`${this.apiUrlPdvs}/${nombre}`);
    }
    
    createPdv(pdv: PDV): Observable<PDV> {
        return this.http.post<PDV>(`${this.apiUrlPdvs}`, pdv);
    }
    
    updatePdv(id: number, pdv: PDV): Observable<PDV> {
        return this.http.put<PDV>(`${this.apiUrlPdvs}/${id}`, pdv);
    }
    
    deletePdv(id: number): Observable<PDV> {
        return this.http.delete<PDV>(`${this.apiUrlPdvs}/${id}`);
    }
    
    getPerfumeriasPaginado(page: number, size: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrlPerfumerias}/paginado?page=${page}&size=${size}`);
    }
    
    getPerfumeriasByNombrePaginado(nombre: string, page: number, size: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrlPerfumerias}/byNombre/${nombre}/paginado?page=${page}&size=${size}`);
    }
    
    getPerfumeriasActivas(): Observable<any> {
        return this.http.get<any>(`${this.apiUrlPerfumerias}/activas`);
    }
    
    getPerfumeriasActivasPaginado(page: number, size: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrlPerfumerias}/activas/paginado?page=${page}&size=${size}`);
    }
    
    getPerfumeriasActivasByNombrePaginado(perfumeria: string, page: number, size: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrlPerfumerias}/activas/${perfumeria}/paginado?page=${page}&size=${size}`);
    }
    
    getPerfumeria(nombre: string): Observable<Perfumeria> {
        return this.http.get<Perfumeria>(`${this.apiUrlPerfumerias}/${nombre}`);
    }
    
    createPerfumeria(perfumeria: Perfumeria): Observable<Perfumeria> {
        return this.http.post<Perfumeria>(`${this.apiUrlPerfumerias}`, perfumeria);
    }

    nuevoPdvPerfumeria(id: number, pdv: PDV): Observable<Perfumeria> {
        return this.http.put<Perfumeria>(`${this.apiUrlPerfumerias}/${id}/nuevoPDV`, pdv);
    }

    eliminarPdvPerfumeria(id: number, pdv: PDV): Observable<Perfumeria> {
        return this.http.put<Perfumeria>(`${this.apiUrlPerfumerias}/${id}/eliminarPDV/${pdv.id}`, pdv);
    }
    
    getPdvsPerfumeria(nombre: string) {
        return this.http.get<PDV[]>(`${this.apiUrlPerfumerias}/${nombre}/pdvsPerfumeria`);
    }
    
    getPdvsSinAsignar() {
        return this.http.get<PDV[]>(`${this.apiUrlPerfumerias}/pdvsSinAsignar`);
    }
    
    getPerfumeriasByNombrePDV(nombre: string) {
        return this.http.get<Perfumeria>(`${this.apiUrlPerfumerias}/byNombrePdv/${nombre}`);
    }
    
    getPerfumeriasByPdvAttributes() {
        return this.http.get<Perfumeria[]>(`${this.apiUrlPerfumerias}/byPdvAttributes`);
    }
    
    updatePerfumeria(perfumeria: Perfumeria): Observable<Perfumeria> {
        return this.http.put<Perfumeria>(`${this.apiUrlPerfumerias}/${perfumeria.id}`, perfumeria);
    }
    
    deletePerfumeria(id: number): Observable<Perfumeria> {
        return this.http.delete<Perfumeria>(`${this.apiUrlPerfumerias}/${id}`);
    }

    getOtrasDireccionesPaginado(page: number, size: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrlOtrasDirecciones}/paginado?page=${page}&size=${size}`);
    }

    getOtrasDireccionesByNombre(nombre: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrlOtrasDirecciones}/byNombre/${nombre}`);
    }

    getOtrasDireccionesByNombrePaginado(nombre: string, page: number, size: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrlOtrasDirecciones}/byNombre/${nombre}/paginado?page=${page}&size=${size}`);
    }

    getOtraDireccion(id: number): Observable<OtraDireccion> {
        return this.http.get<OtraDireccion>(`${this.apiUrlOtrasDirecciones}/${id}`);
    }

    createOtraDireccion(otraDireccion: OtraDireccion): Observable<OtraDireccion> {
        return this.http.post<OtraDireccion>(`${this.apiUrlOtrasDirecciones}`, otraDireccion);
    }

    updateOtraDireccion(id: number, otraDireccion: OtraDireccion): Observable<OtraDireccion> {
        return this.http.put<OtraDireccion>(`${this.apiUrlOtrasDirecciones}/${id}`, otraDireccion);
    }

    deleteOtraDireccion(id: number): Observable<OtraDireccion> {
        return this.http.delete<OtraDireccion>(`${this.apiUrlOtrasDirecciones}/${id}`);
    }

}