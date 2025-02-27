import { Component, Input, OnInit } from '@angular/core';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';

@Component({
  selector: 'app-pantalla-carga',
  templateUrl: './pantalla-carga.component.html',
  styleUrls: ['./pantalla-carga.component.css']
})
export class PantallaCargaComponent{
  cargando: Boolean = false;

  constructor(private pantallaCarga: PantallaCargaService) {
    this.pantallaCarga.loading$.subscribe((cargando: Boolean) => {
      this.cargando = cargando;
    });
  }
}
