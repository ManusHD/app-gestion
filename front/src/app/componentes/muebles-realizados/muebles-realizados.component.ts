import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject } from 'rxjs';
import { Mueble } from 'src/app/models/mueble.model';
import { MuebleService } from 'src/app/services/mueble.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { RoleService } from 'src/app/services/role.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-muebles-realizados',
  templateUrl: './muebles-realizados.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './muebles-realizados.component.css',
  ],
})
export class MueblesRealizadosComponent implements OnInit {
  muebles: Mueble[] = [];
  columnasPaginator: string[] = ['fechaOrden', 'fechaRealizacion', 'destino', 'facturado', 'tipoAccion'];
  dataSource = new MatTableDataSource<Mueble>();
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

  private mueblesParaExportarSubject = new BehaviorSubject<Mueble[]>([]);
  mueblesParaExportar$ = this.mueblesParaExportarSubject.asObservable();

  constructor(
    private muebleService: MuebleService,
    private carga: PantallaCargaService,
    private snackbar: SnackBar,
    private roleService: RoleService,
  ) {}

  ngOnInit(): void {
    this.cargarMuebles();
    this.agregarColumnasRoles();
  }

  agregarColumnasRoles() {
    this.roleService.getRoles().subscribe(roles => {
      if(roles.isAdmin){
        this.columnasPaginator.push('detalles')
      }
    });
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarMuebles();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.buscando) {
      this.buscarMuebles();
    } else {
      this.cargarMuebles();
    }
  }

  cargarMuebles() {
    this.carga.show();
    this.muebleService
      .getMueblesByEstadoPaginado(true, this.pageIndex, this.pageSize)
      .subscribe(
        (data) => {
          this.resetearFecha();
          this.muebles = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSource.data = this.muebles;
          this.carga.hide();
        },
        (error) => {
          this.carga.hide();
          this.snackbar.snackBarError(error.error.message || error.error);
        }
      );
  }

  buscarMuebles() {
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
      this.muebleService
        .getFiltradasMueblesPaginadas(
          this.fechaInicio,
          this.fechaFin,
          this.tipoBusqueda,
          this.buscador,
          this.pageIndex,
          this.pageSize
        )
        .subscribe(
          (data) => {
            this.muebles = data.content;
            setTimeout(() => {
              this.totalElementos = data.totalElements;
            });
            this.dataSource.data = this.muebles;
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
    this.cargarMuebles();
  }

  resetearFecha() {
    const hoy = new Date();
    this.fechaFin = hoy.toISOString().split('T')[0];

    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 2);
    this.fechaInicio = primerDiaMes.toISOString().split('T')[0];
  }

  obtenerDatosAExportar() {
    this.mueblesParaExportarSubject.next(this.muebles);
    if (this.buscando) {
      this.muebleService
        .getFiltradasMuebles(
          this.fechaInicio,
          this.fechaFin,
          this.tipoBusqueda,
          this.buscador
        )
        .subscribe((data) => {
          this.mueblesParaExportarSubject.next(data);
        });
    } else {
      this.muebleService.getMueblesByEstado(true).subscribe((data) => {
        this.mueblesParaExportarSubject.next(data);
      });
    }
  }

  obtenerDestino(mueble: Mueble): string {
    if (mueble.perfumeria) {
      let destino = mueble.perfumeria;
      if (mueble.pdv) {
        destino += ' - ' + mueble.pdv;
      }
      return destino;
    } else if (mueble.colaborador) {
      return mueble.colaborador;
    } else if (mueble.otroDestino) {
      return mueble.otroDestino;
    }
    return 'No especificado';
  }

  estaFacturado(mueble: Mueble): boolean {
    return !!(mueble.importeFacturar && mueble.importeFacturar > 0);
  }
}