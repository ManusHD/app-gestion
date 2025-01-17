import { Component, inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
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
  ubicacion: Ubicacion = new Ubicacion();
  existe: boolean = false;

  constructor(
    private ubiService: UbicacionService,
    private snackBar: SnackBar
  ) {}

  existeUbicacion() {
    if (this.ubicacion.nombre == '') {
      this.existe = false;
    } else {
      console.log(this.ubicacion.nombre);
      this.ubiService
        .getUbicacionByNombre(this.ubicacion.nombre!)
        .subscribe((data) => {
          if (data != null) {
            this.existe = true;
            console.log('Existe: ', this.existe);
          } else {
            this.existe = false;
            console.log('NO existe: ', this.existe);
          }
        });
    }
  }

  onSubmit() {
    if (!this.existe) {
      console.log('Ubicación a enviar: ', this.ubicacion);
      const productos: ProductoUbicacion[] = [];
      this.ubicacion.productos = productos;
      this.ubiService.newUbicacion(this.ubicacion).subscribe({
        next: (data) => {
          console.log('Ubicación creada correctamente: ', data);
          this.snackBar.snackBarExito('Ubicación guardada correctamente');
          location.reload();
        },
        error: (error) => {
          console.error('Error al crear Ubicación', error);
          this.snackBar.snackBarError('Error al crear la Ubicación: ' + error);
        },
      });
    } else {
      this.snackBar.snackBarError('Ya existe una Ubicación con este nombre');
    }
  }
}
