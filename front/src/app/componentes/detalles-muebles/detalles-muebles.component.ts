import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Mueble } from 'src/app/models/mueble.model';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';

@Component({
  selector: 'app-detalles-muebles',
  templateUrl: './detalles-muebles.component.html',
  styleUrls: [
    '../../../assets/styles/modal.css', 
    './detalles-muebles.component.css',
  ],
})
export class DetallesMueblesComponent implements OnInit {
  mostrarModal: boolean = false;
  @Input() enRealizados: boolean = true;
  @Input() mueble!: Mueble;
  @Output() muebleRelleno = new EventEmitter<boolean>();
  currentPath: String = window.location.pathname;
  
  constructor(private carga: PantallaCargaService) {}

  ngOnInit() {
    if (!this.enRealizados) {
      this.iniciarMuebles();
    }
  }

  iniciarMuebles() {
    this.muebleRelleno.emit(this.todosLosCamposRellenos());
  }

  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  obtenerDestino(): string {
    if (this.mueble.perfumeria) {
      let destino = this.mueble.perfumeria;
      if (this.mueble.pdv) {
        destino += ' - ' + this.mueble.pdv;
      }
      if (this.mueble.colaborador) {
        destino += ' (' + this.mueble.colaborador + ')';
      }
      return destino;
    } else if (this.mueble.otroDestino) {
      return this.mueble.otroDestino;
    }
    return 'No especificado';
  }

  todosLosCamposRellenos(): boolean {
    return !!(
      this.mueble.fechaOrdenTrabajo &&
      this.mueble.fechaAsignacion &&
      this.mueble.tipoAccion &&
      this.mueble.presupuesto !== null &&
      this.mueble.presupuesto !== undefined &&
      this.mueble.costeColaborador !== null &&
      this.mueble.costeColaborador !== undefined &&
      this.mueble.costeEnvio !== null &&
      this.mueble.costeEnvio !== undefined &&
      this.mueble.productos &&
      this.mueble.productos.length > 0 &&
      this.mueble.productos.every(p => p.ref && p.description && p.estado && p.unidades)
    );
  }
}