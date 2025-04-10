import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Colaborador } from 'src/app/models/colaborador.model';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
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
    telefono2: '',
    dni: '',
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
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  buscando: boolean = false;

  columnasColaboradores: string[] = ['nombre', 'estado', 'dni', 'telefono', 'telefono2', 'direccion', 'acciones'];
  dataSourceColaboradores = new MatTableDataSource<Colaborador>();

  @ViewChild(MatPaginator) paginatorColaboradores!: MatPaginator;

  constructor(
    private direccionesService: DireccionesService,
    private snackbar: SnackBar,
    private carga: PantallaCargaService
  ) {}

  ngOnInit(): void {
    this.cargarColaboradores();
  }
  
    cambiarPagina(event: PageEvent) {
      this.pageIndex = event.pageIndex; 
      this.pageSize = event.pageSize;   
      if(this.buscando){
        this.buscarColaboradores();
      } else {
        this.cargarColaboradores();         
      }
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
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarColaboradores();
  }

  buscarColaboradores() {
    this.carga.show();
    if(!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;
    this.direccionesService.getColaboradoresByNombrePaginado(this.buscador, this.pageIndex, this.pageSize)
      .subscribe((data) => {
        this.colaboradores = data.content;
        setTimeout(() => {
          this.totalElementos = data.totalElements;
        });
        this.dataSourceColaboradores.data = this.colaboradores;
    
        setTimeout(() => {
          this.carga.hide();
        }); 
      },
      () => {
        setTimeout(() => {
          this.carga.hide();
        }); 
      }
    )
  }

  cargarColaboradores(): void {
    this.carga.show();
    this.direccionesService.getColaboradoresPaginado(this.pageIndex, this.pageSize).subscribe(
      (data) => {
        this.colaboradores = data.content;
        setTimeout(() => {
          this.totalElementos = data.totalElements;
        });
        this.dataSourceColaboradores.data = this.colaboradores;
        setTimeout(() => {
          this.carga.hide();
        }); 
      },
      (error) => {
        console.error('Error al cargar los colaboradores', error);
        setTimeout(() => {
          this.carga.hide();
        }); 
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
        this.carga.show();
        this.nuevaColaborador.nombre = this.nuevaColaborador.nombre.trim();
        this.nuevaColaborador.activa = true;
        this.direccionesService.createColaborador(this.nuevaColaborador).subscribe(
          (data: Colaborador) => {
            this.colaboradores.push(data);
            this.cargarColaboradores();
            this.nuevaColaborador = {};
            this.snackbar.snackBarExito('Colaborador creado con éxito');
            setTimeout(() => {
              this.carga.hide();
            }); 
          },
          (error) => {
            console.error('Error al crear el colaborador', error);
            setTimeout(() => {
              this.carga.hide();
            }); 
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

      this.carga.show();
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
            setTimeout(() => {
              this.carga.hide();
            }); 
          },
          (error) => {
            this.snackbar.snackBarError(error.error.error);
            console.error('Error al actualizar el colaborador', error);
            setTimeout(() => {
              this.carga.hide();
            }); 
          }
        );
    }
  }

  cancelarEdit(): void {
    this.editandoId = null;
    this.editandoColaborador = {};
  }

  eliminarColaborador(id: number): void {
    this.carga.show();
    this.direccionesService.deleteColaborador(id).subscribe(
      () => {
        this.colaboradores = this.colaboradores.filter(c => c.id !== id);
        this.dataSourceColaboradores.data = [...this.colaboradores];
        setTimeout(() => {
          this.carga.hide();
        }); 
      },
      (error) => {
        console.error('Error al eliminar el colaborador', error);
        setTimeout(() => {
          this.carga.hide();
        }); 
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
