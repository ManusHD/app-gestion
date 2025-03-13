import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
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
    
  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarEntradas();
  }

  cargarEntradas() {
    this.carga.show();
    this.entradaService
      .getEntradasByEstadoPaginado(false, this.pageIndex, this.pageSize)
      .subscribe((data) => {
        this.entradas = data.content;
        setTimeout(() => {
          this.totalElementos = data.totalElements;
        })
        this.dataSource.data = this.entradas;
        this.cdr.detectChanges();
        this.carga.hide();
      },
      (error) => {
        this.carga.hide();
        this.snackBarError(error.error.message || error.error);
        console.error(error);
      });
  }

  setRecibida(id: number) {
    this.btnSubmitActivado = false;
    this.carga.show();
    this.entradaService
      .setRecibida(id)
      .pipe(
        catchError((error) => {
          const mensaje = this.handleError(error);
          this.snackBarError(mensaje || error.error.message || error.error);
          this.carga.hide();
          this.btnSubmitActivado = true;
          return throwError(error);
        })
      )
      .subscribe((data) => {
        this.cargarEntradas();
        this.carga.hide();
        console.log('Entrada grabada con éxito');
        this.snackBarExito('Entrada grabada con éxito');
        this.btnSubmitActivado = true;
      }),
      (error: any) => {
        this.carga.hide();
        this.btnSubmitActivado = true;
        this.snackBarError(error.error.message || error.error);
        console.error(error);
      };
  }

  deleteEntrada(idEntrada: number) {
    this.carga.show();
    this.btnSubmitActivado = false;
    this.entradaService.deleteEntrada(idEntrada).subscribe(
      (data: Entrada) => {
        this.cargarEntradas();
        this.carga.hide();
        console.log('Entrada borrada con éxito');
        this.snackBarExito('Entrada borrada con éxito');
        this.btnSubmitActivado = true;
      },
      (error) => {
        this.carga.hide();
        this.btnSubmitActivado = true;
        console.error(error);
        this.snackBarError('No se puede borrar la entrada por un conflicto en la BBDD');
      }
    );
  }
}
