import { Component, EventEmitter, inject, OnInit } from '@angular/core';
import { ProductoUbicacion } from 'src/app/models/productoUbicacion.model';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { SnackBar } from 'src/app/services/snackBar.service';
import { UbicacionService } from 'src/app/services/ubicacion.service';

@Component({
  selector: 'app-ubicaciones',
  templateUrl: './ubicaciones.component.html',
  styleUrls: ['./ubicaciones.component.css'],
})
export class UbicacionesComponent {
  ubicaciones: Ubicacion[] = [];
  nuevaUbicacion: Ubicacion = {};
  ubicacionCreada = new EventEmitter<void>();

  buscador: string = '';

  constructor(
    private ubiService: UbicacionService,
    private snackBar: SnackBar
  ) {}

  crearUbicacion() {
      console.log('Ubicación a enviar: ', this.nuevaUbicacion);
      const productos: ProductoUbicacion[] = [];
      this.nuevaUbicacion.productos = productos;
      this.nuevaUbicacion.nombre = this.nuevaUbicacion.nombre?.trim();
      this.ubiService.newUbicacion(this.nuevaUbicacion).subscribe({
        next: (data) => {
          console.log('Ubicación creada correctamente: ', data);
          this.snackBar.snackBarExito('Ubicación guardada correctamente');
          this.nuevaUbicacion.nombre = '';
          this.ubicacionCreada.emit();
        },
        error: (error) => {
          console.error('Error al crear Ubicación', error);
          this.snackBar.snackBarError(error.error.message);
        },
      });
    
  }
}
