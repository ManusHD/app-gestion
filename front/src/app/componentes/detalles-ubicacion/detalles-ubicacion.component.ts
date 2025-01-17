import { Component, Input } from '@angular/core';
import { Ubicacion } from 'src/app/models/ubicacion.model';

@Component({
  selector: 'app-detalles-ubicacion',
  templateUrl: './detalles-ubicacion.component.html',
  styleUrls: ['../../../assets/styles/modal.css', './detalles-ubicacion.component.css']
})
export class DetallesUbicacionComponent {
  mostrarModal: boolean = false;
  @Input() ubicacion!: Ubicacion;

  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
}
