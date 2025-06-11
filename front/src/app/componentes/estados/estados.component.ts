import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Estado } from 'src/app/models/estado.model';
import { EstadoService } from 'src/app/services/estado.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-estados',
  templateUrl: './estados.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './estados.component.css',
  ],
})
export class EstadosComponent implements OnInit {
  estados: Estado[] = [];
  buscador: string = '';
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  buscando: boolean = false;
  nuevoEstado: Estado = {};

  // Propiedades para la edición en línea
  editingId: number | null = null;
  editingEstado: Estado = {};

  columnasEstado: string[] = ['nombre'];
  dataSourceEstado = new MatTableDataSource<Estado>();
  @ViewChild(MatPaginator) paginatorEstado!: MatPaginator;

  constructor(
    private estadoService: EstadoService,
    private snackbar: SnackBar,
    private carga: PantallaCargaService
  ) {}

  ngOnInit(): void {
    this.cargarEstados();
  }

  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.buscando) {
      this.buscarEstados();
    } else {
      this.cargarEstados();
    }
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarEstados();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarEstados();
  }

  buscarEstados() {
    this.carga.show();
    if (!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;
    this.estadoService
      .getEstadosByNombrePaginado(this.buscador, this.pageIndex, this.pageSize)
      .subscribe(
        (data) => {
          this.estados = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSourceEstado.data = this.estados;
          setTimeout(() => {
            this.carga.hide();
          });
        },
        () => {
          setTimeout(() => {
            this.carga.hide();
          });
        }
      );
  }

  cargarEstados() {
    this.estadoService
      .getEstadosPaginados(this.pageIndex, this.pageSize)
      .subscribe(
        (data) => {
          this.estados = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSourceEstado.data = this.estados;
          setTimeout(() => {
            this.carga.hide();
          });
        },
        () => {
          setTimeout(() => {
            this.carga.hide();
          });
        }
      );
  }

  editarEstado(estado: Estado) {
    this.editingId = estado.id!;
    this.editingEstado = { ...estado };
  }

  guardarEdicion() {
    if (this.editingId && this.editingEstado.nombre?.trim()) {
      this.carga.show();
      this.estadoService
        .putEstado(this.editingId, this.editingEstado)
        .subscribe(
          (estadoActualizado) => {
            const i = this.estados.findIndex(
              (e) => e.id === estadoActualizado.id
            );
            if (i !== -1) this.estados[i] = estadoActualizado;
            this.dataSourceEstado.data = [...this.estados];
            this.cancelarEdicion();
            this.carga.hide();
            this.snackbar.snackBarExito(
              'Estado actualizado correctamente. Los productos asociados también han sido actualizados.'
            );
          },
          (error) => {
            this.carga.hide();
            if (error.status === 409) {
              this.snackbar.snackBarError('Ya existe un estado con ese nombre');
            } else {
              this.snackbar.snackBarError('Error al actualizar el estado');
            }
          }
        );
    } else {
      this.snackbar.snackBarError('El nombre no puede estar vacío');
    }
  }

  cancelarEdicion() {
    this.editingId = null;
    this.editingEstado = {};
  }

  crearEstado() {
    this.carga.show();
    this.estadoService.postEstado(this.nuevoEstado).subscribe({
      next: (data) => {
        console.log('Estado creado correctamente: ', data);
        this.snackbar.snackBarExito('Estado guardado correctamente');
        this.nuevoEstado.nombre = '';
        setTimeout(() => {
          this.cargarEstados();
          this.carga.hide();
        });
      },
      error: (error) => {
        this.carga.hide();
        console.error('Error al crear Estado', error);
        this.snackbar.snackBarError(
          'Ya existe el estado: ' + this.nuevoEstado.nombre
        );
        setTimeout(() => {
          this.carga.hide();
        });
      },
    });
  }

  eliminarEstado(estado: Estado) {
    // Primero verificar si el estado está en uso
    this.carga.show();
    this.estadoService.verificarEstadoEnUso(estado.id!).subscribe(
      (enUso) => {
        this.carga.hide();
        if (enUso) {
          this.snackbar.snackBarError(
            'No se puede eliminar el estado porque está siendo utilizado por productos'
          );
        } else {
          // Si no está en uso, proceder con la eliminación
          this.procederEliminacion(estado);
        }
      },
      (error) => {
        this.carga.hide();
        this.snackbar.snackBarError('Error al verificar el estado');
      }
    );
  }

  private procederEliminacion(estado: Estado) {
    this.carga.show();
    this.estadoService.deleteEstado(estado.id!).subscribe(
      () => {
        this.estados = this.estados.filter((e) => e.id !== estado.id);
        this.dataSourceEstado.data = [...this.estados];
        this.totalElementos--;
        this.carga.hide();
        this.snackbar.snackBarExito('Estado eliminado correctamente');
      },
      (error) => {
        this.carga.hide();
        if (error.status === 409) {
          this.snackbar.snackBarError(
            'No se puede eliminar el estado porque está siendo utilizado'
          );
        } else {
          this.snackbar.snackBarError('Error al eliminar el estado');
        }
      }
    );
  }
}
