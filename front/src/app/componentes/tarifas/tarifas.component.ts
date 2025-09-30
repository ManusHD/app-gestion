import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Producto } from 'src/app/models/producto.model';
import { Tarifa } from 'src/app/models/tarifa.model';
import { SnackBar } from 'src/app/services/snackBar.service';
import { TarifaService } from 'src/app/services/tarifas.service';

@Component({
  selector: 'app-tarifas',
  templateUrl: './tarifas.component.html',
  styleUrls: ['./tarifas.component.css']
})
export class TarifasComponent implements OnInit {
  currentPath = window.location.pathname;
  tarifas: Tarifa[] = [];
  buscador: string = '';
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  buscando: boolean = false;

  // Para crear nueva tarifa
  nuevaTarifa: Tarifa = {
    nombre: '',
    importe: 0
  };

  columnasStock: string[] = ['nombre', 'importe'];
  dataSourceStock = new MatTableDataSource<Tarifa>();
  @ViewChild(MatPaginator) paginatorStock!: MatPaginator;

  constructor(
    private tarifaService: TarifaService,
    private snackBar: SnackBar
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
      .getTarifaByNombre(this.buscador)
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
}
