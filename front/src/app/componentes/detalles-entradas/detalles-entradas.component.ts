import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar  } from '@angular/material/snack-bar';
import { Entrada } from 'src/app/models/entrada.model';
import { EntradaServices } from 'src/app/services/entrada.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';

@Component({
  selector: 'app-detalles-entradas',
  templateUrl: './detalles-entradas.component.html',
  styleUrls: [
    '../../../assets/styles/modal.css', 
    './detalles-entradas.component.css',
  ],
})
export class DetallesEntradasComponent implements OnInit {
  mostrarModal: boolean = false;
  @Input() enRecibidas: boolean = true;
  @Input() entrada!: Entrada;
  @Output() entradaRellena = new EventEmitter<boolean>();
  currentPath: String = window.location.pathname;
  
  constructor(private carga: PantallaCargaService){}

  ngOnInit() {
    if(!this.enRecibidas) {
      this.iniciarEntradas();
    }
  }

  iniciarEntradas() {
    this.formatearFecha(this.entrada.fechaRecepcion);
    this.entradaRellena.emit(this.todosLosCamposRellenos());
  }

  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  actualizarFecha(fecha: string) {
    this.entrada.fechaRecepcion = fecha;
  }

  todosLosCamposRellenos(): boolean {
    return this.entrada.productos!.every(
      (producto) =>
        producto.description &&
        producto.unidades != null &&
        producto.unidades > 0 &&
        this.entrada.fechaRecepcion &&
        producto.ubicacion &&
        producto.palets != null &&
        producto.bultos != null &&
        producto.comprobado
    );
  }
  
  formatearFecha(fecha: any): string | null {
    if (!fecha) return null;

    // Si la fecha ya está en formato Date o Date string
    if (fecha instanceof Date || typeof fecha === 'string') {
      return new Date(fecha).toISOString().split('T')[0];
    }

    // Si es un número (serial de fecha de Excel)
    if (typeof fecha === 'number') {
      // Convertir número de serie de Excel a fecha
      const excelDate = new Date(Date.UTC(1900, 0, fecha - 1));
      return excelDate.toISOString().split('T')[0];
    }

    return null;
  }

}
