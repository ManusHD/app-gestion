import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PDV } from 'src/app/models/pdv.model';
import { Perfumeria } from 'src/app/models/perfumeria.model';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-perfumerias',
  templateUrl: './perfumerias.component.html',
  styleUrls: ['../../../../assets/styles/paginator.css', './perfumerias.component.css'],
})
export class PerfumeriasComponent implements OnInit {
  currentPath = window.location.pathname;
  perfumerias: Perfumeria[] = [];
  nuevaPerfumeria: Perfumeria = { pdvs: [] };
  indexPerfumeriaSeleccionada: number = -1;
  existe: boolean = true;
  editandoId: number | null = null;
  editandoPerfumeria: Perfumeria = { pdvs: [] };
  buscador: string = '';

  // Variables para manejar la adición de Perfumerías en creación y edición
  pdvParaAgregar: string = '';
  pdvParaAgregarEdit: string = '';
  // Propiedades nuevas
  pdvs: PDV[] = [];
  pdvSeleccionado: PDV | null = null;
  pdvSeleccionadoEdit: PDV | null = null;

  columnasPerfumerias: string[] = ['nombre', 'estado', 'pdvs', 'acciones'];
  dataSourcePerfumerias = new MatTableDataSource<Perfumeria>();
  @ViewChild(MatPaginator) paginatorPerfumerias!: MatPaginator;

  constructor(
    private perfumeriaService: DireccionesService,
    private snackbar: SnackBar
  ) {}

  ngOnInit(): void {
    this.cargarPerfumerias();
    this.cargarPdvs();
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarPerfumerias();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.cargarPerfumerias();
  }

  buscarPerfumerias() {
    this.perfumeriaService
      .getPerfumeriasByNombre(this.buscador)
      .subscribe((data: Perfumeria[]) => {
        this.perfumerias = data;
        this.dataSourcePerfumerias.data = this.perfumerias;
        this.dataSourcePerfumerias.paginator = this.paginatorPerfumerias;
      });
  }

  cargarPerfumerias(): void {
    this.perfumeriaService.getPerfumerias().subscribe(
      (data: Perfumeria[]) => {
        this.perfumerias = data;
        this.dataSourcePerfumerias.data = this.perfumerias;
        this.dataSourcePerfumerias.paginator = this.paginatorPerfumerias;
      },
      (error) => {
        console.error('Error al cargar las perfumerías', error);
      }
    );
  }

  cargarPdvs() {
    this.perfumeriaService.getPdvs().subscribe(
      (data: PDV[]) => {
        this.pdvs = data;
      }
    );
  }

  crearPerfumeria(): void {
    if (
      !this.nuevaPerfumeria.nombre ||
      this.nuevaPerfumeria.nombre.trim() == ''
    ) {
      this.snackbar.snackBarError('El nombre no puede estar en blanco');
    } else {
      if (this.existe) {
        this.snackbar.snackBarError('Ya existe esta perfumería');
      } else {
        this.nuevaPerfumeria.activa = true;
        this.nuevaPerfumeria.nombre = this.nuevaPerfumeria.nombre?.trim();
        if(!this.nuevaPerfumeria.pdvs) {
          this.nuevaPerfumeria.pdvs = [];
        }
        this.perfumeriaService.createPerfumeria(this.nuevaPerfumeria).subscribe(
          (data: Perfumeria) => {
            this.perfumerias.push(data);
            this.cargarPerfumerias();
            this.nuevaPerfumeria = { pdvs: [] };
            this.pdvParaAgregar = '';
            this.snackbar.snackBarExito('Perfumería creada con éxito');
          },
          (error) => {
            console.error('Error al crear la perfumería', error);
          }
        );
      }
    }
  }

  existePerfumeria(nombre: string) {
    if (nombre && nombre.trim() !== '') {
      this.perfumeriaService.getPerfumeria(nombre!.trim()).subscribe(
        (data: Perfumeria) => {
          if (data == null) {
            this.existe = false;
          } else {
            this.existe = true;
          }
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

  editarPerfumeria(perfumeria: Perfumeria): void {
    this.editandoId = perfumeria.id!;
    this.editandoPerfumeria = { ...perfumeria, pdvs: [...perfumeria.pdvs || []] };
    this.pdvParaAgregarEdit = '';
  }

  guardarEdit(): void {
    if (this.editandoId && this.editandoPerfumeria) {
      if (!this.editandoPerfumeria.nombre || this.editandoPerfumeria.nombre.trim() === '') {
        this.snackbar.snackBarError('El nombre no puede estar en blanco');
        return;
      }

      this.editandoPerfumeria.nombre = this.editandoPerfumeria.nombre.trim();
      
      this.perfumeriaService
        .updatePerfumeria(this.editandoPerfumeria)
        .subscribe(
          (data: Perfumeria) => {
            const index = this.perfumerias.findIndex((p) => p.id === data.id);
            if (index !== -1) {
              this.perfumerias[index] = data;
            }
            this.cargarPerfumerias();
            this.cancelarEdit();
            this.snackbar.snackBarExito('Perfumería actualizada con éxito');
          },
          (error) => {
            this.snackbar.snackBarError(error.error.message);
            console.error('Error al actualizar la perfumería', error);
          }
        );
    }
  }

  cancelarEdit(): void {
    this.editandoId = null;
    this.editandoPerfumeria = { pdvs: [] };
  }

  eliminarPerfumeria(id: number): void {
    this.perfumeriaService.deletePerfumeria(id).subscribe(
      () => {
        this.perfumerias = this.perfumerias.filter((p) => p.id !== id);
        this.dataSourcePerfumerias.data = [...this.perfumerias];
      },
      (error) => {
        console.error('Error al eliminar la perfumería', error);
      }
    );
  }

  obtenerPDVsSelect(perfumeria: Perfumeria) {
    const idsPDVsPerfumeria = new Set(perfumeria.pdvs.map(pdv => pdv.id));

    const pdvsNoEnPerfumeria = this.pdvs.filter(pdv => !idsPDVsPerfumeria.has(pdv.id));

    return pdvsNoEnPerfumeria;
  }

  // MÉTODOS PARA MANEJAR PERFUMERÍAS EN MODO CREACIÓN

  agregarPdv(): void {
    if (this.pdvSeleccionado) {
      if (!this.nuevaPerfumeria.pdvs) {
        this.nuevaPerfumeria.pdvs = [];
      }
      // Evitar duplicados
      const existe = this.nuevaPerfumeria.pdvs.some(
        (p) => p.id === this.pdvSeleccionado!.id
      );
      if (!existe) {
        this.nuevaPerfumeria.pdvs.push(this.pdvSeleccionado);
      }
      // Reiniciamos el select
      this.pdvSeleccionado = null;
    }
  }

  eliminarPdvDeNuevo(index: number): void {
    if (
      this.nuevaPerfumeria.pdvs &&
      index >= 0 &&
      index < this.nuevaPerfumeria.pdvs.length
    ) {
      this.nuevaPerfumeria.pdvs.splice(index, 1);
    }
  }

  // MÉTODOS PARA MANEJAR PERFUMERÍAS EN MODO EDICIÓN

  agregarPdvEdit() {
    if (this.pdvSeleccionadoEdit && this.editandoPerfumeria.id) {
      this.perfumeriaService
        .nuevoPdvPerfumeria(
          this.editandoPerfumeria.id,
          this.pdvSeleccionadoEdit
        )
        .subscribe(
          (data: Perfumeria) => {
            this.editandoPerfumeria = data;
            const index = this.perfumerias.findIndex((p) => p.id === data.id);
            if (index !== -1) {
              this.perfumerias[index] = data;
            }
            this.pdvSeleccionadoEdit = null;
            this.snackbar.snackBarExito('PDV agregado con éxito');
          },
          (error) => {
            console.error('Error al agregar EL PDV', error);
            this.snackbar.snackBarError('Error al agregar el PDV');
          }
        );
    }
  }

  eliminarPdvDeEdit(index: number): void {
    if (
      this.editandoPerfumeria.id &&
      this.editandoPerfumeria.pdvs &&
      index >= 0 &&
      index < this.editandoPerfumeria.pdvs.length
    ) {
      const pdvAEliminar = this.editandoPerfumeria.pdvs[index];
      this.perfumeriaService
        .eliminarPdvPerfumeria(this.editandoPerfumeria.id, pdvAEliminar)
        .subscribe(
          (data: Perfumeria) => {
            this.editandoPerfumeria = data;
            const idx = this.pdvs.findIndex((p) => p.id === data.id);
            if (idx !== -1) {
              this.perfumerias[idx] = data;
            }
            this.snackbar.snackBarExito('PDV eliminado con éxito');
          },
          (error) => {
            console.error('Error al eliminar la perfumería', error);
            this.snackbar.snackBarError('Error al eliminar la perfumería');
          }
        );
    }
  }



}
