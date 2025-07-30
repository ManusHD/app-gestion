import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { catchError, throwError } from 'rxjs';
import { Trabajo } from 'src/app/models/trabajo.model';
import { TrabajoService } from 'src/app/services/trabajo.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SnackBar } from 'src/app/services/snackBar.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-trabajos-pendientes',
  templateUrl: './trabajos-pendientes.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './trabajos-pendientes.component.css',
  ],
})
export class TrabajosPendientesComponent implements OnInit {
  trabajos: Trabajo[] = [];
  columnasPaginator: string[] = ['fecha', 'concepto', 'direccion', 'horas', 'importe', 'acciones'];
  dataSource = new MatTableDataSource<Trabajo>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  btnSubmitActivado = true;

  constructor(
    private trabajoService: TrabajoService,
    private carga: PantallaCargaService,
    private snackbar: SnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarTrabajos();
  }
    
  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarTrabajos();
  }

  cargarTrabajos() {
    this.carga.show();
    this.trabajoService
      .getTrabajosByEstadoPaginado(false, this.pageIndex, this.pageSize)
      .subscribe((data) => {
        this.trabajos = data.content;
        setTimeout(() => {
          this.totalElementos = data.totalElements;
        })
        this.dataSource.data = this.trabajos;
        this.cdr.detectChanges();
        this.carga.hide();
      },
      (error) => {
        this.carga.hide();
        this.snackbar.snackBarError(error.error.message || error.error);
        console.error(error);
      });
  }

  marcarComoRealizado(id: number) {
    // Buscar el trabajo en la lista actual
    const trabajo = this.trabajos.find(t => t.id === id);
    
    if (trabajo && (!trabajo.horas || trabajo.horas <= 0)) {
      this.snackbar.snackBarError('No se puede marcar como realizado: el trabajo debe tener horas asignadas');
      return;
    }
  
    this.btnSubmitActivado = false;
    this.carga.show();
    this.trabajoService
      .marcarComoRealizado(id)
      .pipe(
        catchError((error) => {
          const mensaje = error.error?.message || error.error || 'Error al marcar como realizado';
          this.snackbar.snackBarError(mensaje);
          this.carga.hide();
          this.btnSubmitActivado = true;
          return throwError(error);
        })
      )
      .subscribe((data) => {
        this.cargarTrabajos();
        this.carga.hide();
        console.log('Trabajo marcado como realizado con éxito');
        this.snackbar.snackBarExito('Trabajo marcado como realizado con éxito');
        this.btnSubmitActivado = true;
      });
  }

  deleteTrabajo(idTrabajo: number) {
    this.carga.show();
    this.btnSubmitActivado = false;
    this.trabajoService.deleteTrabajo(idTrabajo).subscribe(
      (data: Trabajo) => {
        this.cargarTrabajos();
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

  getDireccionCompleta(trabajo: Trabajo): string {
    if (trabajo.perfumeria && trabajo.pdv) {
      return `${trabajo.perfumeria} - ${trabajo.pdv}`;
    } else if (trabajo.otroOrigen) {
      return trabajo.otroOrigen;
    }
    return 'Sin dirección';
  }
}