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
      return this.mueble.perfumeria + (this.mueble.pdv ? ' - ' + this.mueble.pdv : '');
    } else if (this.mueble.otroDestino) {
      return this.mueble.otroDestino;
    }
    return 'No especificado';
  }

  todosLosCamposRellenos(): boolean {
    return !!(
      this.mueble.fechaOrdenTrabajo &&
      this.mueble.fechaAsignacion &&
      this.mueble.fechaRealizacion &&
      this.mueble.tipoAccion &&
      this.mueble.costeColaborador !== null &&
      this.mueble.costeEnvio !== null &&
      this.mueble.importeFacturar !== null &&
      this.mueble.productos &&
      this.mueble.productos.length > 0 &&
      this.mueble.productos.every(p => p.ref && p.description && p.estado && p.unidades)
    );
  }
}