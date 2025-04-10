import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductoUbicacion } from 'src/app/models/productoUbicacion.model';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { SalidaUbicacionService } from 'src/app/services/salida-ubicacion.service';
import { UbicacionService } from 'src/app/services/ubicacion.service';

@Component({
  selector: 'app-detalles-ubicacion',
  templateUrl: './detalles-ubicacion.component.html',
  styleUrls: [
    '../../../assets/styles/modal.css',
    './detalles-ubicacion.component.css',
  ],
})
export class DetallesUbicacionComponent {
  currentPath = window.location.pathname;
  mostrarModal: boolean = false;
  @Input() ubicacion!: Ubicacion;

  constructor(
    private salidaUbicacionService: SalidaUbicacionService,
    private router: Router
  ) {}

  sacarUbicacion() {
    this.salidaUbicacionService.enviarProductos(this.ubicacion.productos!);
    this.router.navigate(['/salidas']);
  }

  mostrarDetalles() {
    this.ubicacion.productos = this.ubicacion.productos!.sort((a, b) =>
      (a.ref?.toString() ?? '').localeCompare(b.ref?.toString() ?? '')
    );
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
}
