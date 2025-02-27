import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PDV } from 'src/app/models/pdv.model';
import { Perfumeria } from 'src/app/models/perfumeria.model';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-pdvs',
  templateUrl: './pdvs.component.html',
  styleUrls: [
    '../../../../assets/styles/paginator.css', 
    './pdvs.component.css'
  ], 
})
export class PdvsComponent implements OnInit {
  currentPath = window.location.pathname;
  pdvs: PDV[] = [];
  // Inicializamos el nuevo PDV con un array vacío de Perfumerías
  nuevoPdv: PDV = {};
  pdvSeleccionado: PDV | null = null;
  pdvEditar: PDV | null = null;
  indexPdvSeleccionado: number = -1;
  existe: boolean = true;
  editandoId: number | null = null;
  editandoPdv: PDV = {};
  buscador: string = '';

  columnasPdvs: string[] = [
    'nombre',
    'telefono',
    'direccion',
    'acciones',
  ];
  dataSourcePdvs = new MatTableDataSource<PDV>();

  @ViewChild(MatPaginator) paginatorPdvs!: MatPaginator;

  constructor(
    private direccionesService: DireccionesService,
    private snackbar: SnackBar
  ) {}

  ngOnInit(): void {
    this.cargarPdvs();
  }

  // Manejo de la tecla Enter en el buscador
  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarPdvs();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.cargarPdvs();
  }

  buscarPdvs() {
    this.direccionesService.getPdvsByNombre(this.buscador).subscribe(
      (data: PDV[]) => {
        this.pdvs = data;
        this.dataSourcePdvs.data = this.pdvs;
        this.dataSourcePdvs.paginator = this.paginatorPdvs;
      },
      (error) => {
        console.error('Error al buscar PDVs', error);
      }
    );
  }

  cargarPdvs(): void {
    this.direccionesService.getPdvs().subscribe(
      (data: PDV[]) => {
        this.pdvs = data;
        this.dataSourcePdvs.data = this.pdvs;
        this.dataSourcePdvs.paginator = this.paginatorPdvs;
      },
      (error) => {
        console.error('Error al cargar PDVs', error);
      }
    );
  }

  crearPdv(): void {
    if (!this.nuevoPdv.nombre || this.nuevoPdv.nombre.trim() === '') {
      this.snackbar.snackBarError('El nombre no puede estar en blanco');
    } else {
      if (this.existe) {
        this.snackbar.snackBarError('Ya existe este PDV');
      } else {
        this.nuevoPdv.nombre = this.nuevoPdv.nombre.trim();
        this.direccionesService.createPdv(this.nuevoPdv).subscribe(
          (data: PDV) => {
            this.pdvs.push(data);
            this.cargarPdvs();
            // Reiniciamos el formulario de creación
            this.nuevoPdv = {};
            this.snackbar.snackBarExito('PDV creado con éxito');
          },
          (error) => {
            console.error('Error al crear el PDV', error);
          }
        );
      }
    }
  }

  // Verifica la existencia del PDV mediante el endpoint getPdv
  existePdv(nombre: string) {
    if (nombre && nombre.trim() !== '') {
      this.direccionesService.getPdv(nombre.trim()).subscribe(
        (data: PDV) => {
          this.existe = data != null;
        },
        (error) => {
          console.error(error);
          this.existe = true;
        }
      );
    }
    return this.existe;
  }

  editarPdv(pdv: PDV): void {
    this.editandoId = pdv.id!;
    // Clonamos el PDV (incluyendo la lista de Perfumerías)
    this.editandoPdv = { ...pdv};
  }

  guardarEdit(): void {
    if (this.editandoId && this.editandoPdv) {
      if (!this.editandoPdv.nombre || this.editandoPdv.nombre.trim() === '') {
        this.snackbar.snackBarError('El nombre no puede estar en blanco');
        return;
      }
      this.editandoPdv.nombre = this.editandoPdv.nombre.trim();
      this.direccionesService
        .updatePdv(this.editandoId, this.editandoPdv)
        .subscribe(
          (data: PDV) => {
            const index = this.pdvs.findIndex((p) => p.id === data.id);
            if (index !== -1) {
              this.pdvs[index] = data;
            }
            this.cargarPdvs();
            this.cancelarEdit();
            this.snackbar.snackBarExito('PDV actualizado con éxito');
          },
          (error) => {
            this.snackbar.snackBarError(error.error.message);
            console.error('Error al actualizar el PDV', error);
          }
        );
    }
  }

  cancelarEdit(): void {
    this.editandoId = null;
    this.editandoPdv = {};
  }

  eliminarPdv(id: number): void {
    this.direccionesService.deletePdv(id).subscribe(
      () => {
        this.pdvs = this.pdvs.filter((p) => p.id !== id);
        this.dataSourcePdvs.data = [...this.pdvs];
      },
      (error) => {
        console.error('Error al eliminar el PDV', error);
      }
    );
  }
}
