import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Salida } from 'src/app/models/salida.model';
import { SalidaServices } from 'src/app/services/salida.service';

@Component({
  selector: 'app-salidas-pendientes',
  templateUrl: './salidas-pendientes.component.html',
  styleUrls: ['./salidas-pendientes.component.css', '../detalles-salidas/detalles-salidas.component.css']
})
export class SalidasPendientesComponent implements OnInit {
  salidas: Salida[] = [];

  constructor(private salidaServices: SalidaServices,
    private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.cargarSalidas();
  }

  cargarSalidas() {
    this.salidaServices.getSalidasByEstado(false).subscribe((data: Salida[]) => {
      this.salidas = data;
      console.log(this.salidas);
    });
  }

  setEnviada(id: number) {
    this.salidaServices.setEnviada(id).pipe(
      catchError((error) => {
        this.snackBar.open(error.error || 'Error desconocido', '✖', {
          duration: 3000,
          panelClass: 'error',
        });
        return throwError(error);
      })
    ).subscribe(
      data => {
        location.reload();
      }
    );
  }
}
