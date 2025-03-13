import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject } from 'rxjs';
import { Salida } from 'src/app/models/salida.model';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SalidaServices } from 'src/app/services/salida.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-salidas-enviadas',
  templateUrl: './salidas-enviadas.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './salidas-enviadas.component.css',
  ],
})
export class SalidasEnviadasComponent {
  salidas: Salida[] = [];
  columnasPaginator: string[] = ['fechaEnvio', 'destino', 'detalles'];
  dataSource = new MatTableDataSource<Salida>();
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

  private salidasParaExportarSubject = new BehaviorSubject<Salida[]>([]);
  salidasParaExportar$ = this.salidasParaExportarSubject.asObservable();

  constructor(
    private salidaServices: SalidaServices,
    private carga: PantallaCargaService,
    private snackbar: SnackBar
  ) {}

  ngOnInit(): void {
    this.cargarSalidas();
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarSalidas();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.buscando) {
      this.buscarSalidas();
    } else {
      this.cargarSalidas();
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarSalidas();
  }

  cargarSalidas() {
    this.carga.show();
    this.salidaServices
      .getSalidasByEstadoPaginado(true, this.pageIndex, this.pageSize)
      .subscribe(
        (data) => {
          this.resetearFecha();
          this.salidas = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSource.data = this.salidas;
          setTimeout(() => {
            this.carga.hide();
          });
        },
        (error) => {
          setTimeout(() => {
            this.carga.hide();
          });
          this.snackbar.snackBarError(error.error.message || error.error);
        }
      );
  }

  buscarSalidas() {
    this.carga.show();
    if (!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;
    if (!this.fechaInicio || !this.fechaFin) {
      console.error('Debe seleccionar un rango de fechas');
      this.carga.hide();
      return;
    }

    if (this.fechaInicio && this.fechaFin) {
      this.salidaServices
        .getFiltradasSalidasPaginadas(
          this.fechaInicio,
          this.fechaFin,
          this.tipoBusqueda,
          this.buscador,
          this.pageIndex,
          this.pageSize
        )
        .subscribe((data) => {
          this.salidas = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSource.data = this.salidas;
          setTimeout(() => {
            this.carga.hide();
          });
        });
    } else {
      console.error('Debe seleccionar un rango de fechas');
      this.carga.hide();
    }
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
    this.salidasParaExportarSubject.next(this.salidas);
    if (this.buscando) {
      this.salidaServices
        .getFiltradasSalidas(
          this.fechaInicio,
          this.fechaFin,
          this.tipoBusqueda,
          this.buscador
        )
        .subscribe((data) => {
          this.salidasParaExportarSubject.next(data);
        });
    } else {
      this.salidaServices.getSalidasByEstado(true).subscribe((data) => {
        console.log(data);
        this.salidasParaExportarSubject.next(data);
      });
    }
  }
}
