import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Entrada } from 'src/app/models/entradas.model';
import { EntradaServices } from 'src/app/services/entradas.service';

@Component({
  selector: 'app-entradas-recibidas',
  templateUrl: './entradas-recibidas.component.html',
  styleUrls: ['./entradas-recibidas.component.css', '../detalles-entradas/detalles-entradas.component.css', '../../componentes/entradas-pendientes/entradas-pendientes.component.css']
})
export class EntradasRecibidasComponent implements OnInit{
  entradas: Entrada[] = [];

  constructor(private router: Router, private entradaServices: EntradaServices) {}

  ngOnInit(): void {
      this.cargarEntradas();
  }

  cargarEntradas() {
    this.entradaServices.getEntradas().subscribe((data: Entrada[]) => {
      this.entradas = data.map(entrada => ({ ...entrada, rellena: false }));
      console.log(this.entradas);
    });
  }
}
