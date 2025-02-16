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
        this.entradas = this.entradas.filter((e) => e.id !== id);
        this.dataSource.data = [...this.entradas]
        console.log('Entrada grabada con éxito');
        this.snackBarExito('Entrada grabada con éxito');
        this.btnSubmitActivado = true;
      }),
      (error: any) => {
        this.btnSubmitActivado = true;
        console.error(error);
      };
  }

  deleteEntrada(idEntrada: number) {
    this.entradaService.deleteEntrada(idEntrada).subscribe(
      (data: Entrada) => {
        this.entradas = this.entradas.filter((e) => e.id !== idEntrada);
        this.dataSource.data = [...this.entradas]
        console.log('Entrada borrada con éxito');
        this.snackBarExito('Entrada borrada con éxito');
        this.btnSubmitActivado = true;
      },
      (error) => {
        this.btnSubmitActivado = true;
        console.error(error);
      }
    );
  }
}
