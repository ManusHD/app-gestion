import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { catchError, throwError } from 'rxjs';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { SnackBar } from 'src/app/services/snackBar.service';
import { UbicacionService } from 'src/app/services/ubicacion.service';

@Component({
  selector: 'app-lista-ubicaciones',
  templateUrl: './lista-ubicaciones.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './lista-ubicaciones.component.css',
  ],
})
export class ListaUbicacionesComponent implements OnInit {
  currentPath = window.location.pathname;
  ubicaciones: Ubicacion[] = [];
  tipoBusqueda: string = 'ubicaciones';
  buscador: string = '';

  // Propiedades para la edición en línea
  editingId: number | null = null;
  editingUbicacion: Ubicacion = {};

  columnasUbicaciones: string[] = ['nombre', 'detalles'];
  dataSourceUbicaciones = new MatTableDataSource<Ubicacion>();
  @ViewChild(MatPaginator) paginatorUbicaciones!: MatPaginator;

  @Input() ubicacionCreada = new EventEmitter<void>(); 

  constructor(
    private ubicacionService: UbicacionService,
    private snackbar: SnackBar
  ) {}

  ngOnInit(): void {
    this.cargarUbicaciones();
    if(this.currentPath == '/ubicaciones') {
      this.columnasUbicaciones.push('acciones');
      this.ubicacionCreada.subscribe(() => {
        this.cargarUbicaciones();
      });
    }
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarUbicaciones();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.cargarUbicaciones();
  }

  buscarUbicaciones() {
    if (this.tipoBusqueda === 'ubicaciones') {
      this.ubicacionService.getUbicacionesByNombre(this.buscador)
        .subscribe((data: Ubicacion[]) => {
          this.ubicaciones = data;
          this.dataSourceUbicaciones.data = this.ubicaciones;
          this.dataSourceUbicaciones.paginator = this.paginatorUbicaciones;
        });
    } else {
      this.ubicacionService.getUbicacionesByReferenciaProducto(this.buscador)
        .subscribe((data: Ubicacion[]) => {
          this.ubicaciones = data;
          this.dataSourceUbicaciones.data = this.ubicaciones;
          this.dataSourceUbicaciones.paginator = this.paginatorUbicaciones;
        });
    }
  }

  cargarUbicaciones(): void {
    this.ubicacionService.getUbicacionesOrderByNombre().subscribe(
      (data: Ubicacion[]) => {
        this.ubicaciones = data;
        this.dataSourceUbicaciones.data = this.ubicaciones;
        this.dataSourceUbicaciones.paginator = this.paginatorUbicaciones;
      },
      (error) => {
        console.error('Error al cargar las ubicaciones', error);
      }
    );
  }

  // Método para iniciar la edición
  startEditing(ubicacion: Ubicacion): void {
    this.editingId = ubicacion.id!;
    this.editingUbicacion = { ...ubicacion };
  }

  // Método para guardar los cambios
  saveEdit(): void {
    if (this.editingId && this.editingUbicacion) {
      if (!this.editingUbicacion.nombre || this.editingUbicacion.nombre.trim() === '') {
        this.snackbar.snackBarError('El nombre no puede estar en blanco');
        return;
      }

      this.editingUbicacion.nombre = this.editingUbicacion.nombre.trim();
      
      this.ubicacionService
        .updateUbicacion(this.editingId, this.editingUbicacion)
        .subscribe(
          (data: Ubicacion) => {
            const index = this.ubicaciones.findIndex((u) => u.id === data.id);
            if (index !== -1) {
              this.ubicaciones[index] = data;
            }
            this.cargarUbicaciones();
            this.cancelEdit();
            this.snackbar.snackBarExito('Ubicación actualizada con éxito');
          },
          (error) => {
            this.snackbar.snackBarError(error.error.message);
            console.error('Error al actualizar la ubicación', error);
          }
        );
    }
  }

  // Método para cancelar la edición
  cancelEdit(): void {
    this.editingId = null;
    this.editingUbicacion = {};
  }

  eliminarUbicacion(id: number): void {
    this.ubicacionService.deleteUbicacion(id).subscribe(
      () => {
        this.ubicaciones = this.ubicaciones.filter((u) => u.id !== id);
        this.dataSourceUbicaciones.data = [...this.ubicaciones];
        this.snackbar.snackBarExito('Ubicación eliminada con éxito');
      },
      (error) => {
        this.snackbar.snackBarError('Error al eliminar la ubicación');
        console.error('Error al eliminar la ubicación', error);
      }
    );
  }
}
