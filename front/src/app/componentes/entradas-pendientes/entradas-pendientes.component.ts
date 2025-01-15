import { Component, OnInit } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Entrada } from 'src/app/models/entrada.model';
import { FormularioEntradaSalidaService } from 'src/app/services/formulario-entrada-salida.service';

@Component({
  selector: 'app-entradas-pendientes',
  templateUrl: './entradas-pendientes.component.html',
  styleUrls: [
    './entradas-pendientes.component.css',
    '../entradas-nuevo/entradas-nuevo.component.css',
    '../detalles-entradas/detalles-entradas.component.css',
  ],
})
export class EntradasPendientesComponent
  extends FormularioEntradaSalidaService
  implements OnInit
{
  entradas: Entrada[] = [];
  btnSubmitActivado = true;

  ngOnInit() {
    this.cargarEntradas();
  }

  cargarEntradas() {
    this.entradasFormService
      .getEntradasByEstado(false)
      .subscribe((data: Entrada[]) => {
        this.entradas = data;
        console.log(this.entradas);
      });
  }

  setRecibida(id: number) {
    this.entradasFormService
      .setRecibida(id)
      .pipe(
        catchError((error) => {
          this.snackBarError(error.error);
          return throwError(error);
        })
      )
      .subscribe((data) => {
        location.reload();
      });
  }

  deleteEntrada(idEntrada: number) {
    this.entradaService.deleteEntrada(idEntrada).subscribe(
      (data) => {
        console.log('Entrada borrada con éxito');
        location.reload();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  desactivarBtnSubmit() {
    this.btnSubmitActivado = false;
    if (this.btnSubmitActivado) {
      console.log('El botón está activado');
    } else {
      console.log('El botón está desactivado');
    }
  }
}
