import { Injectable } from "@angular/core";
import { Entrada } from "../models/entrada.model";
import { HttpClient } from "@angular/common/http";
import { Salida } from "../models/salida.model";

@Injectable()
export class ReubicarPaletsService {
    private apiUrlEntradas = 'http://localhost:8092/entradas';
    private apiUrlSalidas = 'http://localhost:8093/salidas';
    
    constructor(private httpClient: HttpClient) {}

    reubicarPaletsEntrada(entrada: Entrada) {
        return this.httpClient.post<Entrada>(`${this.apiUrlEntradas}/reubicarPalets`, entrada);
    }

    reubicarPaletsSalida(salida: Salida) {
        return this.httpClient.post<Entrada>(`${this.apiUrlSalidas}/reubicarPalets`, salida);
    }
    
    getPaletsRecibidos() {
        return this.httpClient.get<number>(`${this.apiUrlEntradas}/paletsRecibidos`);
    }
    
    getPaletsEnviados() {
        return this.httpClient.get<number>(`${this.apiUrlSalidas}/paletsEnviados`);
    }

}