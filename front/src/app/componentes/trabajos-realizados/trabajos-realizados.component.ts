import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject } from 'rxjs';
import { Trabajo } from 'src/app/models/trabajo.model';
import { TrabajoService } from 'src/app/services/trabajo.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-trabajos-realizados',
  templateUrl: './trabajos-realizados.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './trabajos-realizados.component.css',
  ],
})
export class TrabajosRealizadosComponent implements OnInit {
  trabajos: Trabajo[] = [];
  trabajosExcel: Trabajo[] = [];
  columnasPaginator: string[] = ['fecha', 'concepto', 'direccion', 'horas', 'importe', 'observaciones'];
  dataSource = new MatTableDataSource<Trabajo>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Propiedades para el filtrado
  tipoBusqueda: string = 'concepto';
  buscador: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  buscando: boolean = false;

  private trabajosParaExportarSubject = new BehaviorSubject<Trabajo[]>([]);
  trabajosParaExportar$ = this.trabajosParaExportarSubject.asObservable();

  constructor(
    private trabajoService: TrabajoService,
    private carga: PantallaCargaService,
    private snackbar: SnackBar
  ) { }

  ngOnInit(): void {
    this.cargarTrabajos();
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarTrabajos();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.buscando) {
      this.buscarTrabajos();
    } else {
      this.cargarTrabajos();
    }
  }

  cargarTrabajos() {
    this.carga.show();
    this.trabajoService
      .getTrabajosByEstadoPaginado(true, this.pageIndex, this.pageSize)
      .subscribe(
        (data) => {
          this.resetearFecha();
          this.trabajos = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSource.data = this.trabajos;
          this.carga.hide();
        },
        (error) => {
          this.carga.hide();
          this.snackbar.snackBarError(error.error.message || error.error);
        }
      );
  }

  buscarTrabajos() {
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
      this.trabajoService
        .getFiltradasTrabajosPaginadas(
          this.fechaInicio,
          this.fechaFin,
          this.tipoBusqueda,
          this.buscador,
          this.pageIndex,
          this.pageSize
        )
        .subscribe(
          (data) => {
            this.trabajos = data.content;
            setTimeout(() => {
              this.totalElementos = data.totalElements;
            });
            this.dataSource.data = this.trabajos;
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
      this.snackbar.snackBarError('Debe seleccionar un rango de fechas');
      setTimeout(() => {
        this.carga.hide();
      });
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarTrabajos();
  }

  resetearFecha() {
    const hoy = new Date();
    this.fechaFin = hoy.toISOString().split('T')[0];

    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 2);
    this.fechaInicio = primerDiaMes.toISOString().split('T')[0];
  }

  obtenerDatosAExportar() {
    this.trabajosParaExportarSubject.next(this.trabajos);
    if (this.buscando) {
      this.trabajoService
        .getFiltradasTrabajos(
          this.fechaInicio,
          this.fechaFin,
          this.tipoBusqueda,
          this.buscador
        )
        .subscribe((data) => {
          this.trabajosParaExportarSubject.next(data);
        });
    } else {
      this.trabajoService.getTrabajosByEstado(true).subscribe((data) => {
        console.log(data);
        this.trabajosParaExportarSubject.next(data);
      });
    }
  }

  getDireccionCompleta(trabajo: Trabajo): string {
    if (trabajo.perfumeria && trabajo.pdv) {
      return `${trabajo.perfumeria} - ${trabajo.pdv}`;
    } else if (trabajo.otroOrigen) {
      return trabajo.otroOrigen;
    }
    return 'Sin dirección';
  }

  getDireccionTipo(trabajo: Trabajo): string {
    if (trabajo.perfumeria && trabajo.pdv) {
      return 'Perfumería';
    } else if (trabajo.otroOrigen) {
      return 'Otro destino';
    }
    return 'Sin especificar';
  }

  getDireccionIcon(trabajo: Trabajo): string {
    if (trabajo.perfumeria && trabajo.pdv) {
      return 'store';
    } else if (trabajo.otroOrigen) {
      return 'business';
    }
    return 'location_off';
  }
}