import { Injectable } from "@angular/core";
import { Entrada } from "../models/entradas.model";
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

  setRecibida(id: number): Observable<Entrada> {
    return this.httpClient.put<Entrada>(`${this.apiUrl}/${id}/recibir`, null);
  }

  updateEntrada(id: number, entrada: Entrada): Observable<Entrada> {
    return this.httpClient.put<Entrada>(`${this.apiUrl}/${id}`, entrada);
  }

}
