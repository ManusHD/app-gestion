import { Component, Input, OnInit } from '@angular/core';
import { ProductoUbicacion } from 'src/app/models/productoUbicacion.model';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { UbicacionService } from 'src/app/services/ubicacion.service';

@Component({
  selector: 'app-detalles-ubicacion',
  templateUrl: './detalles-ubicacion.component.html',
  styleUrls: ['../../../assets/styles/modal.css', './detalles-ubicacion.component.css']
})
export class DetallesUbicacionComponent {
  currentPath = window.location.pathname;
  mostrarModal: boolean = false;
  @Input() ubicacion!: Ubicacion;
  ubicaciones: Ubicacion[] = [];

  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
}
