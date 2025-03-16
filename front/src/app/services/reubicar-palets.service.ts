import { Injectable } from "@angular/core";
import { Entrada } from "../models/entrada.model";
import { HttpClient } from "@angular/common/http";
import { Salida } from "../models/salida.model";
import { environment } from '../../environments/environment-dev';

@Injectable()
export class ReubicarPaletsService {
    private apiUrlEntradas =  environment.apiEntradas;
    private apiUrlSalidas =  environment.apiSalidas;
    
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