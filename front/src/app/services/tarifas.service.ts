import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment-dev";
import { Tarifa } from "../models/tarifa.model";

@Injectable()
export class TarifaService {
    private url = environment.apiTarifas;

    constructor(private httpClient: HttpClient) { }


    getTarifas(page: number, size: number): Observable<any> {
        return this.httpClient.get<any>(`${this.url}?page=${page}&size=${size}`);
    }

    getTarifaByNombre(nombre: string): Observable<any> {
        return this.httpClient.get<any>(`${this.url}/nombre/${nombre}`);
    }

    crearTarifa(tarifa: Tarifa): Observable<Tarifa> {
        return this.httpClient.post<Tarifa>(this.url, tarifa);
    }

    updateTarifa(tarifa: Tarifa): Observable<Tarifa> {
        return this.httpClient.put<Tarifa>(this.url, tarifa);
    }
}