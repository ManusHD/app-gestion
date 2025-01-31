import { Component, OnInit } from '@angular/core';
import { throwError, catchError } from 'rxjs';
import { Salida } from 'src/app/models/salida.model';
import { FormularioEntradaSalidaService } from 'src/app/services/formulario-entrada-salida.service';

@Component({
  selector: 'app-salidas-pendientes',
  templateUrl: './salidas-pendientes.component.html',
  styleUrls: [
    '../detalles-salidas/detalles-salidas.component.css',
    './salidas-pendientes.component.css',
  ],
})
export class SalidasPendientesComponent
  extends FormularioEntradaSalidaService
  implements OnInit
{
  salidas: Salida[] = [];

  ngOnInit() {
    this.cargarSalidas();
  }

  cargarSalidas() {
    this.salidaService.getSalidasByEstado(false).subscribe((data: Salida[]) => {
      this.salidas = data;
      console.log(this.salidas);
      this.cdr.detectChanges();
    });
  }

  setEnviada(id: number) {
    this.salidaService
      .setEnviada(id)
      .pipe(
        catchError((error) => {
          this.snackBarError(error.error);
          return throwError(error);
        })
      )
      .subscribe(
        (data) => {
          location.reload();
        },
        (error) => {
          this.btnSubmitActivado = true;
          console.error(error);
        }
      );
  }

  deleteSalida(idSalida: number) {
    this.salidaService.deleteSalida(idSalida).subscribe(
      (data) => {
        console.log('Salida borrada con éxito');
        location.reload();
      },
      (error) => {
        console.error(error);
      }
    );
  }
}
