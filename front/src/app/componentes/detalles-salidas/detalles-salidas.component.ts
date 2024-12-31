import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar  } from '@angular/material/snack-bar';
import { Salida } from 'src/app/models/salida.model';
import { SalidaServices } from 'src/app/services/salida.service';

@Component({
  selector: 'app-detalles-salidas',
  templateUrl: './detalles-salidas.component.html',
  styleUrls: ['./detalles-salidas.component.css']
})
export class DetallesSalidasComponent implements OnInit {
  mostrarModal: boolean = false;
  @Input() enRecibidas: boolean = false;
  @Input() salida!: Salida;
  @Output() salidaRellena = new EventEmitter<boolean>();

  private snackBar = inject(MatSnackBar);

  constructor(private salidaServices: SalidaServices, ) {}

  ngOnInit() {
    if(!this.enRecibidas) {
      this.iniciarSalidas();
      this.salidaRellena.emit(this.todosLosCamposRellenos());
    }
  }

  modificarSalida() {
    this.salidaServices.updateSalida(this.salida.id!, this.salida).subscribe({
      next: (updatedSalida) => {
        console.log('Salida actualizada:', updatedSalida);
        this.salidaRellena.emit(this.todosLosCamposRellenos());
        this.snackBar.open('Salida creada correctamente', '✖', {
          duration: 3000,
          panelClass: 'exito'
        });
        this.cerrarModal();
      },
      error: (error) => {
        console.error('Error al actualizar la salida:', error);
        this.snackBar.open('Error al guardar la salida: ' + error, '✖', {
          duration: 3000,
          panelClass: 'error'
        });
      },
    });
  }

  iniciarSalidas() {
    this.salida.fechaEnvio = this.formatearFecha(this.salida.fechaEnvio)!;
  }

  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  actualizarFecha(fecha: string) {
      this.salida.fechaEnvio = fecha;
  }

  todosLosCamposRellenos(): boolean {
    return this.salida.productos!.every(
      (producto) =>
        producto.description &&
        producto.unidades! > 0 && 
        this.salida.fechaEnvio &&
        producto.ubicacion &&
        producto.ubicacion.trim() !== '' &&
        producto.palets! > 0 &&   
        producto.bultos! > 0 &&   
        this.salida.formaEnvio &&
        this.salida.formaEnvio.trim() !== ''
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
