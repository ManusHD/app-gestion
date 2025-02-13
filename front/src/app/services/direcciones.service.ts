import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Colaborador } from "../models/colaborador.model";
import { PDV } from "../models/pdv.model";
import { Perfumeria } from "../models/perfumeria.model";
import { OtraDireccion } from "../models/otraDireccion.model";

@Injectable()
export class DireccionesService {
    private apiUrlColaboradores = 'http://localhost:8097/colaboradores';
    private apiUrlPdvs = 'http://localhost:8097/pdvs';
    private apiUrlPerfumerias = 'http://localhost:8097/perfumerias';
    private apiUrlOtrasDirecciones = 'http://localhost:8097/otrasDirecciones';

    constructor(private http: HttpClient) {}

    getColaboradores(): Observable<Colaborador[]> {
        return this.http.get<Colaborador[]>(`${this.apiUrlColaboradores}`);
    }

    getColaboradoresByNombre(nombre: string): Observable<Colaborador[]> {
        return this.http.get<Colaborador[]>(`${this.apiUrlColaboradores}/byNombre/${nombre}`);
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

    getPdvs(): Observable<PDV[]> {
        return this.http.get<PDV[]>(`${this.apiUrlPdvs}`);
    }

    getPdvsByNombre(nombre: string): Observable<PDV[]> {
        return this.http.get<PDV[]>(`${this.apiUrlPdvs}/byNombre/${nombre}`);
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
    
    getPerfumerias(): Observable<Perfumeria[]> {
        return this.http.get<Perfumeria[]>(`${this.apiUrlPerfumerias}`);
    }
    
    getPerfumeriasByNombre(nombre: string): Observable<Perfumeria[]> {
        return this.http.get<Perfumeria[]>(`${this.apiUrlPerfumerias}/byNombre/${nombre}`);
    }
    
    getPerfumeriasActivas(): Observable<Perfumeria[]> {
        return this.http.get<Perfumeria[]>(`${this.apiUrlPerfumerias}/activas`);
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
        console.log("Nombre enviado: ", nombre);
        return this.http.get<PDV[]>(`${this.apiUrlPerfumerias}/${nombre}/pdvsPerfumeria`);
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

    getOtrasDirecciones(): Observable<OtraDireccion[]> {
        return this.http.get<OtraDireccion[]>(`${this.apiUrlOtrasDirecciones}`);
    }

    getOtrasDireccionesByNombre(nombre: string): Observable<OtraDireccion[]> {
        return this.http.get<OtraDireccion[]>(`${this.apiUrlOtrasDirecciones}/byNombre/${nombre}`);
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