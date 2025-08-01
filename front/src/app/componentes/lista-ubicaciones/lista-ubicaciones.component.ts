import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject } from 'rxjs';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { SnackBar } from 'src/app/services/snackBar.service';
import { UbicacionService } from 'src/app/services/ubicacion.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { EstadoService } from 'src/app/services/estado.service';
import { Estado } from 'src/app/models/estado.model';

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
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  buscando: boolean = false;
  estados: Estado[] = [];
  
  // Propiedades para filtros combinados
  estadoSeleccionado: string = '';
  aplicarFiltroEstado: boolean = false;

  private ubicacionesParaExportarSubject = new BehaviorSubject<Ubicacion[]>([]);
  ubicacionesParaExportar$ = this.ubicacionesParaExportarSubject.asObservable();

  // Propiedades para la edición en línea
  editingId: number | null = null;
  editingUbicacion: Ubicacion = {};

  columnasUbicaciones: string[] = ['nombre', 'detalles'];
  dataSourceUbicaciones = new MatTableDataSource<Ubicacion>();
  @ViewChild(MatPaginator) paginatorUbicaciones!: MatPaginator;

  @Input() ubicacionCreada = new EventEmitter<void>(); 

  constructor(
    private ubicacionService: UbicacionService,
    private estadoService: EstadoService,
    private snackbar: SnackBar,
    private carga: PantallaCargaService
  ) {}

  ngOnInit(): void {
    this.cargarEstados();
    this.cargarUbicaciones();
    if(this.currentPath == '/ubicaciones') {
      this.columnasUbicaciones.push('acciones');
      this.ubicacionCreada.subscribe(() => {
        this.cargarUbicaciones();
      });
    } else if (this.currentPath == '/inventario') {
      this.columnasUbicaciones.push('reubicacion');
      this.ubicacionCreada.subscribe(() => {
        this.cargarUbicaciones();
      });
    }
  }

  cargarEstados() {
    this.estadoService.getEstados().subscribe(
      (data: Estado[]) => {
        this.estados = data;
      },
      (error) => {
        console.error('Error al cargar estados', error);
      }
    );
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarUbicaciones();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  cambiarPagina(event: PageEvent) {
    this.carga.show();
    this.pageIndex = event.pageIndex; 
    this.pageSize = event.pageSize;
    if(this.buscando){
      this.buscarUbicaciones();
    } else {
      this.cargarUbicaciones();         
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarUbicaciones();
  }

  buscarUbicaciones() {
    this.carga.show();
    if(!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;
    
    if (this.tipoBusqueda === 'ubicaciones') {
      this.ubicacionService.getUbicacionesByNombrePaginado(this.buscador, this.pageIndex, this.pageSize)
        .subscribe((data) => {
          this.procesarResultadosBusqueda(data);
        }, () => {
          this.carga.hide();
        });
    } else if(this.tipoBusqueda === 'referencia') {
      if (this.aplicarFiltroEstado && this.estadoSeleccionado) {
        // Búsqueda por referencia + estado
        this.ubicacionService.getUbicacionesByReferenciaAndEstadoPaginado(
          this.buscador, this.estadoSeleccionado, this.pageIndex, this.pageSize)
          .subscribe((data) => {
            this.procesarResultadosBusqueda(data);
          }, () => {
            this.carga.hide();
          });
      } else {
        // Búsqueda solo por referencia
        this.ubicacionService.getUbicacionesByReferenciaProductoPaginado(this.buscador, this.pageIndex, this.pageSize)
          .subscribe((data) => {
            this.procesarResultadosBusqueda(data);
          }, () => {
            this.carga.hide();
          });
      }
    } else if(this.tipoBusqueda === 'descripcion') {
      if (this.aplicarFiltroEstado && this.estadoSeleccionado) {
        // Búsqueda por descripción + estado
        this.ubicacionService.getUbicacionesByDescripcionAndEstadoPaginado(
          this.buscador, this.estadoSeleccionado, this.pageIndex, this.pageSize)
          .subscribe((data) => {
            this.procesarResultadosBusqueda(data);
          }, () => {
            this.carga.hide();
          });
      } else {
        // Búsqueda solo por descripción
        this.ubicacionService.getUbicacionesByDescripcionProductoPaginado(this.buscador, this.pageIndex, this.pageSize)
          .subscribe((data) => {
            this.procesarResultadosBusqueda(data);
          }, () => {
            this.carga.hide();
          });
      }
    } else if(this.tipoBusqueda === 'estado') {
      this.ubicacionService.getUbicacionesByEstadoPaginado(this.buscador, this.pageIndex, this.pageSize)
        .subscribe((data) => {
          this.procesarResultadosBusqueda(data);
        }, () => {
          this.carga.hide();
        });
    }
  }

  private procesarResultadosBusqueda(data: any) {
    this.ubicaciones = data.content;
    setTimeout(() => {
      this.totalElementos = data.totalElements;
    });
    this.dataSourceUbicaciones.data = this.ubicaciones;
    setTimeout(() => {
      this.carga.hide();
    });
  }

  // Método para actualizar el buscador según el tipo
  onTipoBusquedaChange() {
    this.resetearBuscador();
    this.aplicarFiltroEstado = false;
    this.estadoSeleccionado = '';
    this.buscador = '';
  }

  cargarUbicaciones(): void {
    this.carga.show();
    this.ubicacionService.getUbicacionesOrderByNombrePaginadas(this.pageIndex, this.pageSize).subscribe(
      (data) => {
        this.ubicaciones = data.content;
        setTimeout(() => {
          this.totalElementos = data.totalElements;
        });
        this.dataSourceUbicaciones.data = this.ubicaciones;
        setTimeout(() => {
          this.carga.hide();
        }); 
      },
      (error) => {
        console.error('Error al cargar las ubicaciones', error);
        setTimeout(() => {
          this.carga.hide();
        }); 
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
            const mensajeError = error?.error?.message || 'Ya existe una ubicación con ese nombre';
            this.snackbar.snackBarError(mensajeError);
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
    this.carga.show();
    this.ubicacionService.deleteUbicacion(id).subscribe(
      () => {
        this.ubicaciones = this.ubicaciones.filter((u) => u.id !== id);
        this.dataSourceUbicaciones.data = [...this.ubicaciones];
        this.snackbar.snackBarExito('Ubicación eliminada con éxito');
        setTimeout(() => {
          this.carga.hide();
        }); 
      },
      (error) => {
        this.snackbar.snackBarError('Error al eliminar la ubicación');
        console.error('Error al eliminar la ubicación', error);
        setTimeout(() => {
          this.carga.hide();
        }); 
      }
    );
  }

  // Método para obtener datos para exportar
  obtenerDatosAExportar() {
    this.ubicacionesParaExportarSubject.next(this.ubicaciones);
    if (this.buscando) {
      if (this.tipoBusqueda === 'ubicaciones') {
        this.ubicacionService.getUbicacionesByNombre(this.buscador)
        .subscribe(data => {
          this.ubicacionesParaExportarSubject.next(data);
        });
      } else if(this.tipoBusqueda === 'referencia') {
        if (this.aplicarFiltroEstado && this.estadoSeleccionado) {
          this.ubicacionService.getUbicacionesByReferenciaAndEstado(this.buscador, this.estadoSeleccionado)
          .subscribe(data => {
            this.ubicacionesParaExportarSubject.next(data);
          });
        } else {
          this.ubicacionService.getUbicacionesByReferenciaProducto(this.buscador)
          .subscribe(data => {
            this.ubicacionesParaExportarSubject.next(data);
          });
        }
      } else if(this.tipoBusqueda === 'descripcion') {
        if (this.aplicarFiltroEstado && this.estadoSeleccionado) {
          this.ubicacionService.getUbicacionesByDescripcionAndEstado(this.buscador, this.estadoSeleccionado)
          .subscribe(data => {
            this.ubicacionesParaExportarSubject.next(data);
          });
        } else {
          this.ubicacionService.getUbicacionesByDescripcionProducto(this.buscador)
          .subscribe(data => {
            this.ubicacionesParaExportarSubject.next(data);
          });
        }
      } else if(this.tipoBusqueda === 'estado') {
        this.ubicacionService.getUbicacionesByEstado(this.buscador)
        .subscribe(data => {
          this.ubicacionesParaExportarSubject.next(data);
        });
      }
    } else {
      this.ubicacionService.getUbicacionesOrderByNombre()
      .subscribe(data => {
          this.ubicacionesParaExportarSubject.next(data);
        });
    }
  }
}
