import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment-dev";
import { Estado } from "../models/estado.model";
import { Observable } from "rxjs";

@Injectable()
export class EstadoService {
    private apiUrl = environment.apiEstados;

    constructor(private http: HttpClient) {}

    getEstados(): Observable<Estado[]> {
        return this.http.get<Estado[]>(`${this.apiUrl}`);
    }

    getEstadosPaginados(page: number, size: number): Observable<any> {
        return this.http.get<Estado[]>(`${this.apiUrl}/pageable?page=${page}&size=${size}`);
    }

    getEstadosByNombrePaginado(nombre: string, page: number, size: number): Observable<any> {
        return this.http.get<Estado[]>(`${this.apiUrl}/nombre/${nombre}?page=${page}&size=${size}`);
    }

    postEstado(estado: Estado) {
        return this.http.post<Estado>(`${this.apiUrl}`, estado);
    }

    putEstado(id:number, estado: Estado) {
        return this.http.put<Estado>(`${this.apiUrl}/${id}`, estado);
    }

    deleteEstado(id: number) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

}