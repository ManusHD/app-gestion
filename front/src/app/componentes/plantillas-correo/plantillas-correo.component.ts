import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { PlantillaCorreo } from 'src/app/models/plantilla-correo.model';
import { CorreoService } from 'src/app/services/correo.service';
import { SnackBar } from 'src/app/services/snackBar.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { VistaPreviaPlantillaComponent } from '../vista-previa-plantilla/vista-previa-plantilla.component';

@Component({
  selector: 'app-plantillas-correo',
  templateUrl: './plantillas-correo.component.html',
  styleUrls: ['./plantillas-correo.component.css']
})
export class PlantillasCorreoComponent implements OnInit {
  plantillas: PlantillaCorreo[] = [];
  columnasPlantillas: string[] = ['alias', 'asunto', 'estado', 'fechaModificacion', 'acciones'];
  dataSource = new MatTableDataSource<PlantillaCorreo>();
  
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  
  buscador = '';
  buscando = false;
  
  editandoId: number | null = null;
  editandoPlantilla: PlantillaCorreo = {};
  
  nuevaPlantilla: PlantillaCorreo = {
    activa: true
  };
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private correoService: CorreoService,
    private snackBar: SnackBar,
    private carga: PantallaCargaService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarPlantillas();
  }

  cambiarPagina(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.buscando) {
      this.buscarPlantillas();
    } else {
      this.cargarPlantillas();
    }
  }

  cargarPlantillas(): void {
    this.carga.show();
    this.correoService.getPlantillas(this.pageIndex, this.pageSize).subscribe({
      next: (data) => {
        this.plantillas = data.content;
        this.totalElementos = data.totalElements;
        this.dataSource.data = this.plantillas;
        this.carga.hide();
      },
      error: (error) => {
        console.error('Error al cargar plantillas:', error);
        this.snackBar.snackBarError('Error al cargar plantillas');
        this.carga.hide();
      }
    });
  }

  buscarPlantillas(): void {
    if (!this.buscador.trim()) {
      this.resetearBuscador();
      return;
    }

    this.carga.show();
    if (!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;

    this.correoService.buscarPlantillas(this.buscador, this.pageIndex, this.pageSize).subscribe({
      next: (data) => {
        this.plantillas = data.content;
        this.totalElementos = data.totalElements;
        this.dataSource.data = this.plantillas;
        this.carga.hide();
      },
      error: (error) => {
        console.error('Error al buscar plantillas:', error);
        this.snackBar.snackBarError('Error al buscar plantillas');
        this.carga.hide();
      }
    });
  }

  resetearBuscador(): void {
    this.buscador = '';
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarPlantillas();
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.buscarPlantillas();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  crearPlantilla(): void {
    if (!this.nuevaPlantilla.alias || !this.nuevaPlantilla.asunto || !this.nuevaPlantilla.cuerpo) {
      this.snackBar.snackBarError('Por favor complete todos los campos');
      return;
    }

    this.carga.show();
    this.correoService.crearPlantilla(this.nuevaPlantilla).subscribe({
      next: (data) => {
        this.plantillas.unshift(data);
        this.dataSource.data = [...this.plantillas];
        this.nuevaPlantilla = { activa: true };
        this.snackBar.snackBarExito('Plantilla creada exitosamente');
        this.cargarPlantillas();
        this.carga.hide();
      },
      error: (error) => {
        console.error('Error al crear plantilla:', error);
        this.snackBar.snackBarError(error.error || 'Error al crear plantilla');
        this.carga.hide();
      }
    });
  }

  editarPlantilla(plantilla: PlantillaCorreo): void {
    this.editandoId = plantilla.id!;
    this.editandoPlantilla = { ...plantilla };
  }

  guardarEdit(): void {
    if (!this.editandoId || !this.editandoPlantilla) return;

    if (!this.editandoPlantilla.alias || !this.editandoPlantilla.asunto || !this.editandoPlantilla.cuerpo) {
      this.snackBar.snackBarError('Por favor complete todos los campos');
      return;
    }

    this.carga.show();
    this.correoService.actualizarPlantilla(this.editandoId, this.editandoPlantilla).subscribe({
      next: (data) => {
        const index = this.plantillas.findIndex(p => p.id === data.id);
        if (index !== -1) {
          this.plantillas[index] = data;
          this.dataSource.data = [...this.plantillas];
        }
        this.cancelarEdit();
        this.snackBar.snackBarExito('Plantilla actualizada exitosamente');
        this.carga.hide();
      },
      error: (error) => {
        console.error('Error al actualizar plantilla:', error);
        this.snackBar.snackBarError(error.error || 'Error al actualizar plantilla');
        this.carga.hide();
      }
    });
  }

  cancelarEdit(): void {
    this.editandoId = null;
    this.editandoPlantilla = {};
  }

  eliminarPlantilla(id: number): void {
    this.carga.show();
    this.correoService.eliminarPlantilla(id).subscribe({
      next: () => {
        this.plantillas = this.plantillas.filter(p => p.id !== id);
        this.dataSource.data = [...this.plantillas];
        this.snackBar.snackBarExito('Plantilla eliminada exitosamente');
        this.carga.hide();
      },
      error: (error) => {
        console.error('Error al eliminar plantilla:', error);
        this.snackBar.snackBarError('Error al eliminar plantilla');
        this.carga.hide();
      }
    });
  }

  verVistaPrevia(plantilla: PlantillaCorreo): void {
    const dialogRef = this.dialog.open(VistaPreviaPlantillaComponent, {
      width: '800px',
      data: plantilla
    });
  }
}