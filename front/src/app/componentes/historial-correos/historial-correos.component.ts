import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { HistorialCorreo } from 'src/app/models/historial-correo.model';
import { CorreoService } from 'src/app/services/correo.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-historial-correos',
  templateUrl: './historial-correos.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './historial-correos.component.css'
  ]
})
export class HistorialCorreosComponent implements OnInit {
  historial: HistorialCorreo[] = [];
  columnasHistorial: string[] = ['fechaEnvio', 'destinatario', 'asunto', 'enviado', 'acciones'];
  dataSource = new MatTableDataSource<HistorialCorreo>();
  
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  
  buscador = '';
  buscando = false;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private correoService: CorreoService,
    private snackBar: SnackBar,
    private carga: PantallaCargaService
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cambiarPagina(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.buscando) {
      this.buscarHistorial();
    } else {
      this.cargarHistorial();
    }
  }

  cargarHistorial(): void {
    this.carga.show();
    this.correoService.getHistorial(this.pageIndex, this.pageSize).subscribe({
      next: (data) => {
        this.historial = data.content;
        this.totalElementos = data.totalElements;
        this.dataSource.data = this.historial;
        this.carga.hide();
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.snackBar.snackBarError('Error al cargar historial de correos');
        this.carga.hide();
      }
    });
  }

  buscarHistorial(): void {
    if (!this.buscador.trim()) {
      this.resetearBuscador();
      return;
    }

    this.carga.show();
    if (!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;

    this.correoService.buscarHistorial(this.buscador, this.pageIndex, this.pageSize).subscribe({
      next: (data) => {
        this.historial = data.content;
        this.totalElementos = data.totalElements;
        this.dataSource.data = this.historial;
        this.carga.hide();
      },
      error: (error) => {
        console.error('Error al buscar historial:', error);
        this.snackBar.snackBarError('Error al buscar correos');
        this.carga.hide();
      }
    });
  }

  resetearBuscador(): void {
    this.buscador = '';
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarHistorial();
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.buscarHistorial();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }
}