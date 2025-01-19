import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { catchError, throwError } from 'rxjs';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { SnackBar } from 'src/app/services/snackBar.service';
import { UbicacionService } from 'src/app/services/ubicacion.service';

@Component({
  selector: 'app-lista-ubicaciones',
  templateUrl: './lista-ubicaciones.component.html',
  styleUrls: ['../../../assets/styles/buscador.css', '../../../assets/styles/paginator.css', './lista-ubicaciones.component.css', ],
})
export class ListaUbicacionesComponent implements OnInit {
  ubicaciones: Ubicacion[] = [];
  currentPath = window.location.pathname;
  buscador: string = '';
  tipoBusqueda: string = 'productos';

  columnasUbicaciones: string[] = ['nombre', 'detalles'];
  dataSourceUbicaciones = new MatTableDataSource<Ubicacion>();
  @ViewChild(MatPaginator) paginatorUbicaciones!: MatPaginator;

  constructor(
    private ubiService: UbicacionService,
    private snackBar: SnackBar
  ) {}

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      this.buscarUbicaciones();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  buscarUbicaciones() {
    if(this.tipoBusqueda == 'ubicaciones') {
      this.ubiService
        .getUbicacionesByNombre(this.buscador)
        .subscribe((data: Ubicacion[]) => {
          this.ubicaciones = data;
          this.dataSourceUbicaciones.data = this.ubicaciones;
          this.dataSourceUbicaciones.paginator = this.paginatorUbicaciones;
          console.log(this.ubicaciones);
        });
    } else if(this.tipoBusqueda == 'productos') {
      this.ubiService
        .getUbicacionesByReferenciaProducto(this.buscador)
        .subscribe((data: Ubicacion[]) => {
          this.ubicaciones = data;
          this.dataSourceUbicaciones.data = this.ubicaciones;
          this.dataSourceUbicaciones.paginator = this.paginatorUbicaciones;
          console.log(this.ubicaciones);
        });
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.cargarUbicaciones();
  }

  ngOnInit(): void {
    this.cargarUbicaciones();
    if(this.currentPath === '/ubicaciones') {
      this.columnasUbicaciones.push('acciones');
    }
    console.log('Current path:', this.currentPath!);
  }

  cargarUbicaciones() {
    this.ubiService.getUbicacionesOrderByNombre().subscribe({
      next: (data) => {
        this.ubicaciones = data;
        this.dataSourceUbicaciones.data = this.ubicaciones;
        this.dataSourceUbicaciones.paginator = this.paginatorUbicaciones;
      },
      error: (error) => {
        console.error('Error al obtener Ubicaciones', error);
        this.snackBar.snackBarError(
          'Error al obtener las Ubicaciones: ' + error
        );
      },
    });
  }

  eliminarUbicacion(id: number) {
    this.ubiService
      .deleteUbicacion(id)
      .pipe(
        catchError((error) => {
          console.error('Error al eliminar Ubicación', error);
          this.snackBar.snackBarError(error.error);
          return throwError(error);
        })
      )
      .subscribe((data) => {
        console.log('Ubicación eliminada correctamente: ', data);
        location.reload();
        this.snackBar.snackBarExito('Ubicación eliminada correctamente');
      });
  }
}
