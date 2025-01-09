import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar  } from '@angular/material/snack-bar';
import { Entrada } from 'src/app/models/entrada.model';
import { EntradaServices } from 'src/app/services/entrada.service';

@Component({
  selector: 'app-detalles-entradas',
  templateUrl: './detalles-entradas.component.html',
  styleUrls: ['./detalles-entradas.component.css'],
})
export class DetallesEntradasComponent implements OnInit {
  mostrarModal: boolean = false;
  @Input() enRecibidas: boolean = false;
  @Input() entrada!: Entrada;
  @Output() entradaRellena = new EventEmitter<boolean>();

  private snackBar = inject(MatSnackBar);

  constructor(private entradaServices: EntradaServices, ) {}

  ngOnInit() {
    if(!this.enRecibidas) {
      this.iniciarEntradas();
      this.entradaRellena.emit(this.todosLosCamposRellenos());
    }
  }

  iniciarEntradas() {
    this.entrada.productos!.forEach((producto) => {
      if(this.formatearFecha(producto.fechaRecepcion) != null){
        producto.fechaRecepcion = this.formatearFecha(producto.fechaRecepcion)!;
      }
    });
  }

  modificarEntrada() {
    this.entradaServices.updateEntrada(this.entrada.id!, this.entrada).subscribe({
      next: (updatedEntrada) => {
        console.log('Entrada actualizada:', updatedEntrada);
        this.entradaRellena.emit(this.todosLosCamposRellenos());
        this.snackBar.open('Entrada actualizada correctamente', '✖', {
          duration: 3000,
          panelClass: 'exito'
        });
        this.cerrarModal();
      },
      error: (error) => {
        console.error('Error al actualizar la entrada:', error);
        this.snackBar.open('Error al guardar la entrada: ' + error, '✖', {
          duration: 3000,
          panelClass: 'error'
        });
      },
    });
  }

  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  actualizarFecha(fecha: string) {
    this.entrada.productos!.forEach((producto) => {
      producto.fechaRecepcion = fecha;
    });
  }

  todosLosCamposRellenos(): boolean {
    return this.entrada.productos!.every(
      (producto) =>
        producto.description &&
        producto.unidades != null &&
        producto.unidades > 0 &&
        producto.fechaRecepcion &&
        producto.ubicacion &&
        producto.palets != null &&
        producto.bultos != null
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
