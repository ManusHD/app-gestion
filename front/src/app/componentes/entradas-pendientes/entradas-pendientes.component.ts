import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { catchError, throwError } from 'rxjs';
import { Entrada } from 'src/app/models/entrada.model';
import { FormularioEntradaSalidaService } from 'src/app/services/formulario-entrada-salida.service';

@Component({
  selector: 'app-entradas-pendientes',
  templateUrl: './entradas-pendientes.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './entradas-pendientes.component.css',
  ],
})
export class EntradasPendientesComponent
  extends FormularioEntradaSalidaService
  implements OnInit
{
  entradas: Entrada[] = [];
  columnasPaginator: string[] = ['origen', 'dcs', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Entrada>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.cargarEntradas();
  }

  cargarEntradas() {
    this.entradaService
      .getEntradasByEstado(false)
      .subscribe((data: Entrada[]) => {
        this.entradas = data;
        console.log(this.entradas);
        this.dataSource.data = this.entradas;
        this.dataSource.paginator = this.paginator;
        this.cdr.detectChanges();
      });
  }

  // Rest of the methods remain the same
  setRecibida(id: number) {
    this.entradaService
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
}
