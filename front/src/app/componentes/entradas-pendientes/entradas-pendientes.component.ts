import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Entrada } from 'src/app/models/entradas.model';
import { EntradaServices } from 'src/app/services/entradas.service';

@Component({
  selector: 'app-entradas-pendientes',
  templateUrl: './entradas-pendientes.component.html',
  styleUrls: ['./entradas-pendientes.component.css', '../detalles-entradas/detalles-entradas.component.css'],
})
export class EntradasPendientesComponent implements OnInit {
  entradas: Entrada[] = [];

  constructor(private router: Router, private entradaServices: EntradaServices) {}

  ngOnInit() {
    this.cargarEntradas();
  }

  cargarEntradas() {
    this.entradaServices.getEntradas().subscribe((data: Entrada[]) => {
      this.entradas = data;
      console.log(this.entradas);
    });
  }

  setRecibida(id: number) {
    this.entradaServices.setRecibida(id).subscribe(data => {
      location.reload();
    });
  }
  
}

