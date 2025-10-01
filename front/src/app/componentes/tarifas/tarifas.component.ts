import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Producto } from 'src/app/models/producto.model';
import { Tarifa } from 'src/app/models/tarifa.model';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SnackBar } from 'src/app/services/snackBar.service';
import { TarifaService } from 'src/app/services/tarifas.service';

@Component({
  selector: 'app-tarifas',
  templateUrl: './tarifas.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './tarifas.component.css'
  ]
})
export class TarifasComponent implements OnInit {
  currentPath = window.location.pathname;
  tarifas: Tarifa[] = [];
  buscador: string = '';
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  buscando: boolean = false;
  editandoId: number | null = null;
  editandoTarifa!: Tarifa;
  tarifaSeleccionada: Tarifa | null = null;
  tarifaEditar: Tarifa | null = null;
  indexTarifaSeleccionada: number = -1;
  existe: boolean = true;
  nuevaTarifa: Tarifa = {};

  columnasStock: string[] = ['nombre', 'importe', 'acciones'];
  dataSourceStock = new MatTableDataSource<Tarifa>();
  @ViewChild(MatPaginator) paginatorStock!: MatPaginator;

  constructor(
    private tarifaService: TarifaService,
    private snackBar: SnackBar,
    private carga: PantallaCargaService
  ) {}

  ngOnInit(): void {
    this.cargarTarifas();
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      this.buscarTarifa();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }
      
  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarTarifas();         
  }

  buscarTarifa() {
    if(!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;
    this.tarifaService
      .getTarifasByNombre(this.buscador)
      .subscribe((data: any) => {
        this.tarifas = data.content;
        setTimeout(() => {
          this.totalElementos = data.totalElements;
        });
        this.dataSourceStock.data = this.tarifas;
      });
  }

  resetearBuscador() {
    this.buscador = '';
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarTarifas();
  }

  cargarTarifas() {
    this.tarifaService.getTarifas(this.pageIndex, this.pageSize).subscribe((data: any) => {
      this.tarifas = data.content;
      setTimeout(() => {
        this.totalElementos = data.totalElements;
      });
      this.dataSourceStock.data = this.tarifas;
    });
  }

  crearTarifa() {
    if (this.nuevaTarifa.nombre && this.nuevaTarifa.nombre.trim() !== '') {
      this.tarifaService.crearTarifa(this.nuevaTarifa).subscribe({
        next: (response: any) => {
          this.snackBar.snackBarExito('Tarifa creada correctamente');
          this.nuevaTarifa = { nombre: '', importe: 0 }; // Resetear formulario
          this.cargarTarifas(); // Recargar la lista
        },
        error: (error: any) => {
          this.snackBar.snackBarError('Error al crear la tarifa');
          console.error('Error:', error);
        }
      });
    }
  }
  
    seleccionarTarifa(tarifa: Tarifa, index: number): void {
      this.tarifaSeleccionada = { ...tarifa };
      this.tarifaEditar = this.tarifaSeleccionada;
      this.indexTarifaSeleccionada = index;
    }
  
    editarTarifa(tarifa: Tarifa): void {
      this.editandoId = tarifa.id!;
      this.editandoTarifa = { ...tarifa };
    }
  
    guardarEdit(): void {
      if (this.editandoId && this.editandoTarifa) {
        if (!this.editandoTarifa.nombre || this.editandoTarifa.nombre.trim() === '') {
          this.snackBar.snackBarError('El nombre no puede estar en blanco');
          return;
        }
  
        this.editandoTarifa.nombre = this.editandoTarifa.nombre.trim();
        
        this.tarifaService
          .updateTarifa(this.editandoTarifa)
          .subscribe(
            (data: Tarifa) => {
              const index = this.tarifas.findIndex((p) => p.id === data.id);
              if (index !== -1) {
                this.tarifas[index] = data;
              }
              this.cargarTarifas();
              this.cancelarEdit();
              this.snackBar.snackBarExito('Tarifa actualizada con éxito');
            },
            (error) => {
              this.snackBar.snackBarError(error.error.message);
              console.error('Error al actualizar la tarifa', error);
            }
          );
      }
    }
  
    cancelarEdit(): void {
      this.editandoId = null;
      this.editandoTarifa = {};
    }

    eliminarTarifa(id: number): void {
      this.carga.show();
      this.tarifaService.deleteTarifa(id).subscribe(
        () => {
          this.tarifas = this.tarifas.filter((p) => p.id !== id);
          this.dataSourceStock.data = [...this.tarifas];
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
}
