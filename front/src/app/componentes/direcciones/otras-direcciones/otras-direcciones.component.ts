import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { OtraDireccion } from 'src/app/models/otraDireccion.model';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-otras-direcciones',
  templateUrl: './otras-direcciones.component.html',
  styleUrls: ['../../../../assets/styles/paginator.css', './otras-direcciones.component.css'] // Si cuentas con estilos propios
})
export class OtrasDireccionesComponent implements OnInit {
  currentPath = window.location.pathname;
  otrasDirecciones: OtraDireccion[] = [];
  nuevaOtraDireccion: OtraDireccion = {};
  otraDireccionSeleccionada: OtraDireccion | null = null;
  otraDireccionEditar: OtraDireccion | null = null;
  indexOtraDireccionSeleccionada: number = -1;
  existe: boolean = true;
  editandoId: number | null = null;
  editandoOtraDireccion: OtraDireccion = {};
  buscador: string = '';

  columnasOtrasDirecciones: string[] = ['nombre', 'telefono', 'direccion', 'acciones'];
  dataSourceOtrasDirecciones = new MatTableDataSource<OtraDireccion>();

  @ViewChild(MatPaginator) paginatorOtrasDirecciones!: MatPaginator;

  constructor(
    private direccionesService: DireccionesService,
    private snackbar: SnackBar
  ) {}

  ngOnInit(): void {
    this.cargarOtrasDirecciones();
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarOtrasDirecciones();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.cargarOtrasDirecciones();
  }

  buscarOtrasDirecciones() {
    this.direccionesService.getOtrasDireccionesByNombre(this.buscador).subscribe(
      (data: OtraDireccion[]) => {
        this.otrasDirecciones = data;
        this.dataSourceOtrasDirecciones.data = this.otrasDirecciones;
        this.dataSourceOtrasDirecciones.paginator = this.paginatorOtrasDirecciones;
      },
      (error) => {
        console.error('Error al buscar otras direcciones', error);
      }
    );
  }

  cargarOtrasDirecciones(): void {
    this.direccionesService.getOtrasDirecciones().subscribe(
      (data: OtraDireccion[]) => {
        this.otrasDirecciones = data;
        this.dataSourceOtrasDirecciones.data = this.otrasDirecciones;
        this.dataSourceOtrasDirecciones.paginator = this.paginatorOtrasDirecciones;
      },
      (error) => {
        console.error('Error al cargar otras direcciones', error);
      }
    );
  }

  crearOtraDireccion(): void {
    if (!this.nuevaOtraDireccion.nombre || this.nuevaOtraDireccion.nombre.trim() === '') {
      this.snackbar.snackBarError('El nombre no puede estar en blanco');
    } else {
      if (this.existe) {
        this.snackbar.snackBarError('Ya existe esta otra dirección');
      } else {
        this.nuevaOtraDireccion.nombre = this.nuevaOtraDireccion.nombre.trim();
        this.direccionesService.createOtraDireccion(this.nuevaOtraDireccion).subscribe(
          (data: OtraDireccion) => {
            this.otrasDirecciones.push(data);
            this.cargarOtrasDirecciones();
            this.nuevaOtraDireccion = {};
            this.snackbar.snackBarExito('Otra dirección creada con éxito');
          },
          (error) => {
            console.error('Error al crear la otra dirección', error);
          }
        );
      }
    }
  }

  seleccionarOtraDireccion(otraDireccion: OtraDireccion, index: number): void {
    this.otraDireccionSeleccionada = { ...otraDireccion };
    this.otraDireccionEditar = this.otraDireccionSeleccionada;
    this.indexOtraDireccionSeleccionada = index;
  }

  editarOtraDireccion(otraDireccion: OtraDireccion): void {
    this.editandoId = otraDireccion.id!;
    this.editandoOtraDireccion = { ...otraDireccion };
  }

  guardarEdit(): void {
    if (this.editandoId && this.editandoOtraDireccion) {
      if (!this.editandoOtraDireccion.nombre || this.editandoOtraDireccion.nombre.trim() === '') {
        this.snackbar.snackBarError('El nombre no puede estar en blanco');
        return;
      }

      this.editandoOtraDireccion.nombre = this.editandoOtraDireccion.nombre.trim();

      this.direccionesService.updateOtraDireccion(this.editandoId, this.editandoOtraDireccion).subscribe(
        (data: OtraDireccion) => {
          const index = this.otrasDirecciones.findIndex(od => od.id === data.id);
          if (index !== -1) {
            this.otrasDirecciones[index] = data;
          }
          this.cargarOtrasDirecciones();
          this.cancelarEdit();
          this.snackbar.snackBarExito('Otra dirección actualizada con éxito');
        },
        (error) => {
          this.snackbar.snackBarError(error.error.message);
          console.error('Error al actualizar otra dirección', error);
        }
      );
    }
  }

  cancelarEdit(): void {
    this.editandoId = null;
    this.editandoOtraDireccion = {};
  }

  eliminarOtraDireccion(id: number): void {
    this.direccionesService.deleteOtraDireccion(id).subscribe(
      () => {
        this.otrasDirecciones = this.otrasDirecciones.filter(od => od.id !== id);
        this.dataSourceOtrasDirecciones.data = [...this.otrasDirecciones];
      },
      (error) => {
        console.error('Error al eliminar otra dirección', error);
      }
    );
  }

  existeOtraDireccion(nombre: string) {
    if (nombre && nombre.trim() !== '') {
      this.direccionesService.getOtrasDireccionesByNombre(nombre.trim()).subscribe(
        (data: OtraDireccion[]) => {
          this.existe = data && data.length > 0;
        },
        (error) => {
          console.error(error);
          this.existe = true;
        }
      );
    }
    return this.existe;
  }
}
