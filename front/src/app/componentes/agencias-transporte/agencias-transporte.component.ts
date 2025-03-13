import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { AgenciaTransporte } from 'src/app/models/agencia-transporte.model';
import { AgenciasTransporteService } from 'src/app/services/agencias-transporte.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-agencias-transporte',
  templateUrl: './agencias-transporte.component.html',
  styleUrls: ['../../../assets/styles/paginator.css', './agencias-transporte.component.css'],
})
export class AgenciasTransporteComponent implements OnInit {
  currentPath = window.location.pathname;
  agencias: AgenciaTransporte[] = [];
  nuevaAgencia: AgenciaTransporte = {};
  agenciaSeleccionada: AgenciaTransporte | null = null;
  agenciaEditar: AgenciaTransporte | null = null;
  indexAgenciaSeleccionada: number = -1;
  existe: boolean = true;
  editandoId: number | null = null;
  editandoAgencia!: AgenciaTransporte;
  buscador: string = '';

  columnasAgencias: string[] = ['nombre', 'estado', 'acciones'];
  dataSourceAgencias = new MatTableDataSource<AgenciaTransporte>();
  @ViewChild(MatPaginator) paginatorAgencias!: MatPaginator;

  constructor(
    private agenciaService: AgenciasTransporteService,
    private snackbar: SnackBar,
    private carga: PantallaCargaService
  ) {}

  ngOnInit(): void {
    this.cargarAgencias();
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarAgencias();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.cargarAgencias();
  }

  buscarAgencias() {
    this.carga.show();
    this.agenciaService
      .getAgenciasTransporteByNombre(this.buscador)
      .subscribe((data: AgenciaTransporte[]) => {
        this.agencias = data;
        this.dataSourceAgencias.data = this.agencias;
        this.dataSourceAgencias.paginator = this.paginatorAgencias;
        setTimeout(() => {
          this.carga.hide();
        }); 
      });
  }

  cargarAgencias(): void {
    this.carga.show();
    this.agenciaService.getAgenciasTransporte().subscribe(
      (data: AgenciaTransporte[]) => {
        this.agencias = data;
        this.dataSourceAgencias.data = this.agencias;
        this.dataSourceAgencias.paginator = this.paginatorAgencias;
        setTimeout(() => {
          this.carga.hide();
        }); 
      },
      (error) => {
        console.error('Error al cargar las agencias de transporte', error);
        setTimeout(() => {
          this.carga.hide();
        }); 
      }
    );
  }

  crearAgencia(): void {
    if (
      !this.nuevaAgencia.nombre ||
      this.nuevaAgencia.nombre.trim() == ''
    ) {
      this.snackbar.snackBarError('El nombre no puede estar en blanco');
    } else {
      if (this.existe) {
        this.snackbar.snackBarError('Ya existe esta agencia de transporte');
      } else {
        this.carga.show();
        this.nuevaAgencia.activa = true;
        this.nuevaAgencia.nombre = this.nuevaAgencia.nombre?.trim();
        this.agenciaService.newAgenciaTransporte(this.nuevaAgencia).subscribe(
          (data: AgenciaTransporte) => {
            this.agencias.push(data);
            this.cargarAgencias();
            this.nuevaAgencia = {};
            this.snackbar.snackBarExito('Agencia de transporte creada con éxito');
            setTimeout(() => {
              this.carga.hide();
            }); 
          },
          (error) => {
            console.error('Error al crear la agencia de transporte', error);
            setTimeout(() => {
              this.carga.hide();
            }); 
          }
        );
      }
    }
  }

  seleccionarAgencia(agencia: AgenciaTransporte, index: number): void {
    this.agenciaSeleccionada = { ...agencia };
    this.agenciaEditar = this.agenciaSeleccionada;
    this.indexAgenciaSeleccionada = index;
  }

  editarAgencia(agencia: AgenciaTransporte): void {
    this.editandoId = agencia.id!;
    this.editandoAgencia = { ...agencia };
  }

  guardarEdit(): void {
    if (this.editandoId && this.editandoAgencia) {
      if (!this.editandoAgencia.nombre || this.editandoAgencia.nombre.trim() === '') {
        this.snackbar.snackBarError('El nombre no puede estar en blanco');
        return;
      }

      this.editandoAgencia.nombre = this.editandoAgencia.nombre.trim();
      
      this.agenciaService
        .updateAgenciaTransporte(this.editandoAgencia)
        .subscribe(
          (data: AgenciaTransporte) => {
            const index = this.agencias.findIndex((p) => p.id === data.id);
            if (index !== -1) {
              this.agencias[index] = data;
            }
            this.cargarAgencias();
            this.cancelarEdit();
            this.snackbar.snackBarExito('Agencia de transporte actualizada con éxito');
          },
          (error) => {
            this.snackbar.snackBarError(error.error.message);
            console.error('Error al actualizar la agencia de transporte', error);
          }
        );
    }
  }

  cancelarEdit(): void {
    this.editandoId = null;
    this.editandoAgencia = {};
  }

  eliminarAgencia(id: number): void {
    this.carga.show();
    this.agenciaService.deleteAgenciaTransporte(id).subscribe(
      () => {
        this.agencias = this.agencias.filter((p) => p.id !== id);
        this.dataSourceAgencias.data = [...this.agencias];
        setTimeout(() => {
          this.carga.hide();
        }); 
      },
      (error) => {
        console.error('Error al eliminar la agencia de transporte', error);
        setTimeout(() => {
          this.carga.hide();
        }); 
      }
    );
  }

  existeAgencia(nombre: string) {
    if (nombre && nombre.trim() !== '') {
      this.agenciaService.getAgenciaTransporteByNombre(nombre!.trim()).subscribe(
        (data: AgenciaTransporte) => {
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
}