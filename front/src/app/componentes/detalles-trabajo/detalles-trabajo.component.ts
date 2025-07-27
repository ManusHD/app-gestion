import { Component, Input, OnInit } from '@angular/core';
import { Trabajo } from 'src/app/models/trabajo.model';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';

@Component({
  selector: 'app-detalles-trabajo',
  templateUrl: './detalles-trabajo.component.html',
  styleUrls: [
    '../../../assets/styles/modal.css', 
    './detalles-trabajo.component.css',
  ],
})
export class DetallesTrabajoComponent implements OnInit {
  mostrarModal: boolean = false;
  @Input() esRealizado: boolean = true;
  @Input() trabajo!: Trabajo;
  currentPath: String = window.location.pathname;
  
  constructor(private carga: PantallaCargaService) {}

  ngOnInit() {
    if (!this.esRealizado) {
      this.iniciarTrabajo();
    }
  }

  iniciarTrabajo() {
    this.formatearFecha(this.trabajo.fecha);
  }

  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  getDireccionCompleta(): string {
    if (this.trabajo.perfumeria && this.trabajo.pdv) {
      return `${this.trabajo.perfumeria} - ${this.trabajo.pdv}`;
    } else if (this.trabajo.otroOrigen) {
      return this.trabajo.otroOrigen;
    }
    return 'Sin dirección especificada';
  }
  
  formatearFecha(fecha: any): string | null {
    if (!fecha) return null;

    if (fecha instanceof Date || typeof fecha === 'string') {
      return new Date(fecha).toISOString().split('T')[0];
    }

    if (typeof fecha === 'number') {
      const excelDate = new Date(Date.UTC(1900, 0, fecha - 1));
      return excelDate.toISOString().split('T')[0];
    }

    return null;
  }
}