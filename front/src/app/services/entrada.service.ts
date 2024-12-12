import { Injectable } from "@angular/core";
import { Entrada } from "../models/entrada.model";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { from, Observable } from "rxjs";


@Injectable()
export class EntradaServices {
  private apiUrl = 'http://localhost:8092/entradas';

  constructor(private httpClient: HttpClient, private router: Router) {}

  getEntradas(): Observable<Entrada[]> {
    return this.httpClient.get<Entrada[]>(`${this.apiUrl}`);
  }

  getEntradasByEstado(estado: boolean): Observable<Entrada[]> {
    return this.httpClient.get<Entrada[]>(`${this.apiUrl}/estado/${estado}`);
  }

  setRecibida(id: number): Observable<Entrada> {
    return this.httpClient.put<Entrada>(`${this.apiUrl}/${id}/recibir`, null);
  }

  updateEntrada(id: number, entrada: Entrada): Observable<Entrada> {
    return this.httpClient.put<Entrada>(`${this.apiUrl}/${id}`, entrada);
  }

  newEntrada(entrada: Entrada): Observable<Entrada> {
    console.log("Entrada enviada");
    console.log(entrada);
    return this.httpClient.post<Entrada>(`${this.apiUrl}`, entrada);
  }

}
