import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Colaborador } from 'src/app/models/colaborador.model';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-colaboradores',
  templateUrl: './colaboradores.component.html',
  styleUrls: ['../../../../assets/styles/paginator.css', './colaboradores.component.css']
})
export class ColaboradoresComponent implements OnInit {
  currentPath = window.location.pathname;
  colaboradores: Colaborador[] = [];
  nuevaColaborador: Colaborador = {
    telefono: '',
    direccion: '',
    provincia: '',
  };
  colaboradorSeleccionado: Colaborador | null = null;
  colaboradorEditar: Colaborador | null = null;
  indexColaboradorSeleccionado: number = -1;
  existe: boolean = true;
  editandoId: number | null = null;
  editandoColaborador: Colaborador = {};
  buscador: string = '';

  columnasColaboradores: string[] = ['nombre', 'telefono', 'direccion', 'acciones'];
  dataSourceColaboradores = new MatTableDataSource<Colaborador>();

  @ViewChild(MatPaginator) paginatorColaboradores!: MatPaginator;

  constructor(
    private direccionesService: DireccionesService,
    private snackbar: SnackBar
  ) {}

  ngOnInit(): void {
    this.cargarColaboradores();
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarColaboradores();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.cargarColaboradores();
  }

  buscarColaboradores() {
    this.direccionesService.getColaboradoresByNombre(this.buscador)
      .subscribe((data: Colaborador[]) => {
        this.colaboradores = data;
        this.dataSourceColaboradores.data = this.colaboradores;
        this.dataSourceColaboradores.paginator = this.paginatorColaboradores;
      });
  }

  cargarColaboradores(): void {
    this.direccionesService.getColaboradores().subscribe(
      (data: Colaborador[]) => {
        this.colaboradores = data;
        this.dataSourceColaboradores.data = this.colaboradores;
        this.dataSourceColaboradores.paginator = this.paginatorColaboradores;
      },
      (error) => {
        console.error('Error al cargar los colaboradores', error);
      }
    );
  }

  crearColaborador(): void {
    if (!this.nuevaColaborador.nombre || this.nuevaColaborador.nombre.trim() === '') {
      this.snackbar.snackBarError('El nombre no puede estar en blanco');
    } else {
      if (this.existe) {
        this.snackbar.snackBarError('Ya existe este colaborador');
      } else {
        // El id no se modifica en la creación
        this.nuevaColaborador.nombre = this.nuevaColaborador.nombre.trim();
        this.direccionesService.createColaborador(this.nuevaColaborador).subscribe(
          (data: Colaborador) => {
            this.colaboradores.push(data);
            this.cargarColaboradores();
            this.nuevaColaborador = {};
            this.snackbar.snackBarExito('Colaborador creado con éxito');
          },
          (error) => {
            
            console.error('Error al crear el colaborador', error);
          }
        );
      }
    }
  }

  seleccionarColaborador(colaborador: Colaborador, index: number): void {
    this.colaboradorSeleccionado = { ...colaborador };
    this.colaboradorEditar = this.colaboradorSeleccionado;
    this.indexColaboradorSeleccionado = index;
  }

  editarColaborador(colaborador: Colaborador): void {
    this.editandoId = colaborador.id!;
    this.editandoColaborador = { ...colaborador };
  }

  guardarEdit(): void {
    if (this.editandoId && this.editandoColaborador) {
      if (!this.editandoColaborador.nombre || this.editandoColaborador.nombre.trim() === '') {
        this.snackbar.snackBarError('El nombre no puede estar en blanco');
        return;
      }

      this.editandoColaborador.nombre = this.editandoColaborador.nombre.trim();

      this.direccionesService.updateColaborador(this.editandoId, this.editandoColaborador)
        .subscribe(
          (data: Colaborador) => {
            const index = this.colaboradores.findIndex(c => c.id === data.id);
            if (index !== -1) {
              this.colaboradores[index] = data;
            }
            this.cargarColaboradores();
            this.cancelarEdit();
            this.snackbar.snackBarExito('Colaborador actualizado con éxito');
          },
          (error) => {
            this.snackbar.snackBarError(error.error.message);
            console.error('Error al actualizar el colaborador', error);
          }
        );
    }
  }

  cancelarEdit(): void {
    this.editandoId = null;
    this.editandoColaborador = {};
  }

  eliminarColaborador(id: number): void {
    this.direccionesService.deleteColaborador(id).subscribe(
      () => {
        this.colaboradores = this.colaboradores.filter(c => c.id !== id);
        this.dataSourceColaboradores.data = [...this.colaboradores];
      },
      (error) => {
        console.error('Error al eliminar el colaborador', error);
      }
    );
  }

  existeColaborador(nombre: string) {
    if (nombre && nombre.trim() !== '') {
      this.direccionesService.getColaborador(nombre.trim()).subscribe(
        (data: Colaborador) => {
          this.existe = data != null;
          return this.existe;
        },
        (error) => {
          console.error(error);
          this.existe = true;
          return this.existe;
        }
      );
    }
    return true;
  }
}
