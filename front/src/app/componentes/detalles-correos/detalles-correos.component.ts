import { Component, Input } from '@angular/core';
import { HistorialCorreo } from 'src/app/models/historial-correo.model';

@Component({
  selector: 'app-detalles-correos',
  templateUrl: './detalles-correos.component.html',
  styleUrls: [
    '../../../assets/styles/modal.css', 
    './detalles-correos.component.css'
  ]
})
export class DetallesCorreosComponent {
  mostrarModal: boolean = false;
  @Input() data!: HistorialCorreo;

  constructor() {}
  
  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  getEstadoClass(): string {
    return this.data.enviado ? 'estado-exitoso' : 'estado-error';
  }

  getEstadoTexto(): string {
    return this.data.enviado ? 'ENVIADO CORRECTAMENTE' : 'ERROR AL ENVIAR';
  }
}
