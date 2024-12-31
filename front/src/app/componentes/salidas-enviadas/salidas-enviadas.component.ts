import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Salida } from 'src/app/models/salida.model';
import { SalidaServices } from 'src/app/services/salida.service';

@Component({
  selector: 'app-salidas-enviadas',
  templateUrl: './salidas-enviadas.component.html',
  styleUrls: ['./salidas-enviadas.component.css', '../detalles-salidas/detalles-salidas.component.css', '../../componentes/salidas-pendientes/salidas-pendientes.component.css']
})
export class SalidasEnviadasComponent {
  salidas: Salida[] = [];

  constructor(private salidaServices: SalidaServices) {}

  ngOnInit(): void {
      this.cargarSalidas();
  }

  cargarSalidas() {
    this.salidaServices.getSalidasByEstado(true).subscribe((data: Salida[]) => {
      this.salidas = data;
      console.log(this.salidas);
    });
  }
}
