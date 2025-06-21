import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { SalidaUbicacionService } from 'src/app/services/salida-ubicacion.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-selector-ubicaciones-multiples',
  templateUrl: './selector-ubicaciones-multiples.component.html',
  styleUrls: ['./selector-ubicaciones-multiples.component.css']
})
export class SelectorUbicacionesMultiplesComponent implements OnInit {
  ubicacionesSeleccionadas: Ubicacion[] = [];

  constructor(
    private salidaUbicacionService: SalidaUbicacionService,
    private router: Router,
    private snackbar: SnackBar
  ) {}

  ngOnInit(): void {
    this.salidaUbicacionService.ubicacionesSeleccionadas$.subscribe(
      ubicaciones => {
        this.ubicacionesSeleccionadas = ubicaciones;
      }
    );
  }

  quitarUbicacion(ubicacionId: number): void {
    this.salidaUbicacionService.quitarUbicacionDeSeleccion(ubicacionId);
  }

  limpiarSelecciones(): void {
    this.salidaUbicacionService.limpiarSelecciones();
    this.snackbar.snackBarExito('Selecciones limpiadas');
  }

  crearSalidaMultiple(): void {
    // Los productos ya están siendo gestionados por el servicio
    this.router.navigate(['/salidas']);
  }
}
