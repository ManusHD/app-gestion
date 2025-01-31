import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Colaborador } from "../models/colaborador.model";
import { PDV } from "../models/pdv.model";
import { Perfumeria } from "../models/perfumeria.model";

@Injectable()
export class DireccionesService {
    private apiUrlColaboradores = 'http://localhost:8097/colaboradores';
    private apiUrlPdvs = 'http://localhost:8097/pdvs';
    private apiUrlPerfumerias = 'http://localhost:8097/perfumerias';

    constructor(private http: HttpClient) {}

    getColaboradores(): Observable<Colaborador> {
        return this.http.get(`${this.apiUrlColaboradores}`);
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
    
    getPerfumeria(nombre: string): Observable<Perfumeria> {
        return this.http.get<Perfumeria>(`${this.apiUrlPerfumerias}/${nombre}`);
    }
    
    createPerfumeria(perfumeria: Perfumeria): Observable<Perfumeria> {
        return this.http.post<Perfumeria>(`${this.apiUrlPerfumerias}`, perfumeria);
    }
    
    updatePerfumeria(id: number, perfumeria: Perfumeria): Observable<Perfumeria> {
        return this.http.put<Perfumeria>(`${this.apiUrlPerfumerias}/${id}`, perfumeria);
    }
    
    deletePerfumeria(id: number): Observable<Perfumeria> {
        return this.http.delete<Perfumeria>(`${this.apiUrlPerfumerias}/${id}`);
    }
}