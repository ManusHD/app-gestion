import { Component, inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { Entrada } from 'src/app/models/entrada.model';
import { EntradaServices } from 'src/app/services/entrada.service';

@Component({
  selector: 'app-entradas-pendientes',
  templateUrl: './entradas-pendientes.component.html',
  styleUrls: ['./entradas-pendientes.component.css', '../detalles-entradas/detalles-entradas.component.css'],
})
export class EntradasPendientesComponent implements OnInit {
  entradas: Entrada[] = [];

  constructor(private entradaServices: EntradaServices,
      private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.cargarEntradas();
  }

  cargarEntradas() {
    this.entradaServices.getEntradasByEstado(false).subscribe((data: Entrada[]) => {
      this.entradas = data;
      console.log(this.entradas);
    });
  }

  setRecibida(id: number) {
    this.entradaServices.setRecibida(id).pipe(
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
