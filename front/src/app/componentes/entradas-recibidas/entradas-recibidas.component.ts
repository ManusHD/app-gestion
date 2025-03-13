import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Entrada } from 'src/app/models/entrada.model';
import { EntradaServices } from 'src/app/services/entrada.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-entradas-recibidas',
  templateUrl: './entradas-recibidas.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './entradas-recibidas.component.css',
  ],
})
export class EntradasRecibidasComponent implements OnInit {
  entradas: Entrada[] = [];
  entradasExcel: Entrada[] = [];
  columnasPaginator: string[] = ['fechaRecepcion', 'origen', 'dcs', 'detalles'];
  dataSource = new MatTableDataSource<Entrada>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Propiedades para el filtrado
  tipoBusqueda: string = 'referencia';
  buscador: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  buscando: boolean = false;

  private entradasParaExportarSubject = new BehaviorSubject<Entrada[]>([]);
  entradasParaExportar$ = this.entradasParaExportarSubject.asObservable();

  constructor(
    private entradaServices: EntradaServices,
    private carga: PantallaCargaService,
    private snackbar: SnackBar
  ) {}

  ngOnInit(): void {
    this.cargarEntradas();
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarEntradas();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.buscando) {
      this.buscarEntradas();
    } else {
      this.cargarEntradas();
    }
  }

  cargarEntradas() {
    this.carga.show();
    this.entradaServices
      .getEntradasByEstadoPaginado(true, this.pageIndex, this.pageSize)
      .subscribe(
        (data) => {
          this.resetearFecha();
          this.entradas = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSource.data = this.entradas;
          this.carga.hide();
        },
        (error) => {
          this.carga.hide();
          this.snackbar.snackBarError(error.error.message || error.error);
        }
      );
  }

  buscarEntradas() {
    this.carga.show();
    if (!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;
    if (!this.fechaInicio || !this.fechaFin) {
      setTimeout(() => {
        this.carga.hide();
      });
      this.snackbar.snackBarError('Debe seleccionar un rango de fechas');
      return;
    }

    if (this.fechaInicio && this.fechaFin) {
      this.entradaServices
        .getFiltradasEntradasPaginadas(
          this.fechaInicio,
          this.fechaFin,
          this.tipoBusqueda,
          this.buscador,
          this.pageIndex,
          this.pageSize
        )
        .subscribe(
          (data) => {
            this.entradas = data.content;
            setTimeout(() => {
              this.totalElementos = data.totalElements;
            });
            this.dataSource.data = this.entradas;
            setTimeout(() => {
              this.carga.hide();
            });
          },
          (error) => {
            this.carga.hide();
            this.snackbar.snackBarError(error.error.message || error.error);
          }
        );
    } else {
      // Podrías notificar al usuario que debe rellenar ambas fechas.
      this.snackbar.snackBarError('Debe seleccionar un rango de fechas');

      setTimeout(() => {
        this.carga.hide();
      });
    }
  }

  resetearBuscador() {
    // Limpiar filtros y recargar todas las entradas
    this.buscador = '';
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarEntradas();
  }

  resetearFecha() {
    const hoy = new Date();
    this.fechaFin = hoy.toISOString().split('T')[0];

    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 2);
    this.fechaInicio = primerDiaMes.toISOString().split('T')[0];
  }

  // Método para obtener datos para exportar
  obtenerDatosAExportar() {
    // Inicia con un arreglo vacío o los datos actuales de la página
    this.entradasParaExportarSubject.next(this.entradas);
    if (this.buscando) {
      this.entradaServices
        .getFiltradasEntradas(
          this.fechaInicio,
          this.fechaFin,
          this.tipoBusqueda,
          this.buscador
        )
        .subscribe((data) => {
          this.entradasParaExportarSubject.next(data);
        });
    } else {
      this.entradaServices.getEntradasByEstado(true).subscribe((data) => {
        console.log(data);
        this.entradasParaExportarSubject.next(data);
      });
    }
  }
}
