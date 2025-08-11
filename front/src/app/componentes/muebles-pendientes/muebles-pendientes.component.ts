import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { catchError, throwError } from 'rxjs';
import { Mueble } from 'src/app/models/mueble.model';
import { MuebleService } from 'src/app/services/mueble.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-muebles-pendientes',
  templateUrl: './muebles-pendientes.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './muebles-pendientes.component.css',
  ],
})
export class MueblesPendientesComponent implements OnInit {
  muebles: Mueble[] = [];
  columnasPaginator: string[] = ['fechaOrden', 'destino', 'tipoAccion', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Mueble>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  btnSubmitActivado = true;

  constructor(
    private muebleService: MuebleService,
    private carga: PantallaCargaService,
    private snackbar: SnackBar
  ) {}

  ngOnInit() {
    this.cargarMuebles();
  }
    
  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarMuebles();
  }

  cargarMuebles() {
    this.carga.show();
    this.muebleService
      .getMueblesByEstadoPaginado(false, this.pageIndex, this.pageSize)
      .subscribe((data) => {
        this.muebles = data.content;
        setTimeout(() => {
          this.totalElementos = data.totalElements;
        })
        this.dataSource.data = this.muebles;
        this.carga.hide();
      },
      (error) => {
        this.carga.hide();
        this.snackbar.snackBarError(error.error.message || error.error);
        console.error(error);
      });
  }

  marcarComoRealizado(id: number) {
    this.btnSubmitActivado = false;
    this.carga.show();
    this.muebleService
      .marcarComoRealizado(id)
      .pipe(
        catchError((error) => {
          this.snackbar.snackBarError(error.error.message || error.error);
          this.carga.hide();
          this.btnSubmitActivado = true;
          return throwError(error);
        })
      )
      .subscribe((data) => {
        this.cargarMuebles();
        this.carga.hide();
        console.log('Trabajo marcado como realizado');
        this.snackbar.snackBarExito('Trabajo marcado como realizado. Se ha generado automáticamente la previsión de ' + (data.tipoAccion === 'IMPLANTACION' ? 'salida' : 'entrada'));
        this.btnSubmitActivado = true;
      }),
      (error: any) => {
        this.carga.hide();
        this.btnSubmitActivado = true;
        this.snackbar.snackBarError(error.error.message || error.error);
        console.error(error);
      };
  }

  deleteMueble(idMueble: number) {
    this.carga.show();
    this.btnSubmitActivado = false;
    this.muebleService.deleteMueble(idMueble).subscribe(
      (data: Mueble) => {
        this.cargarMuebles();
        this.carga.hide();
        console.log('Trabajo borrado con éxito');
        this.snackbar.snackBarExito('Trabajo borrado con éxito');
        this.btnSubmitActivado = true;
      },
      (error) => {
        this.carga.hide();
        this.btnSubmitActivado = true;
        console.error(error);
        this.snackbar.snackBarError('No se puede borrar el trabajo por un conflicto en la BBDD');
      }
    );
  }

  obtenerDestino(mueble: Mueble): string {
    if (mueble.perfumeria) {
      return mueble.perfumeria + (mueble.pdv ? ' - ' + mueble.pdv : '');
    } else if (mueble.otroDestino) {
      return mueble.otroDestino;
    }
    return 'No especificado';
  }

  estaCompleto(mueble: Mueble): boolean {
    return !!(
      mueble.fechaOrdenTrabajo &&
      mueble.fechaAsignacion &&
      mueble.fechaRealizacion &&
      mueble.tipoAccion &&
      mueble.costeColaborador !== null &&
      mueble.costeEnvio !== null &&
      mueble.importeFacturar !== null &&
      mueble.productos &&
      mueble.productos.length > 0 &&
      mueble.productos.every(p => p.ref && p.description && p.estado && p.unidades)
    );
  }
}