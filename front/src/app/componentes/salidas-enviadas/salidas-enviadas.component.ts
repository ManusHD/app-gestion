import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Salida } from 'src/app/models/salida.model';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SalidaServices } from 'src/app/services/salida.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-salidas-enviadas',
  templateUrl: './salidas-enviadas.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './salidas-enviadas.component.css',
  ],
})
export class SalidasEnviadasComponent {
  salidas: Salida[] = [];
  columnasPaginator: string[] = ['fechaEnvio', 'destino', 'detalles'];
  dataSource = new MatTableDataSource<Salida>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Propiedades para el filtrado
  tipoBusqueda: string = 'referencia';
  buscador: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  buscando: boolean = false;

  constructor(private salidaServices: SalidaServices, private carga: PantallaCargaService, private snackbar: SnackBar) {}

  ngOnInit(): void {
    this.carga.show();
    this.cargarSalidas();
  }
  
  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarSalidas();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }
    
  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize; 
    if(this.buscando){
      this.buscarSalidas();
    } else {
      this.cargarSalidas();         
    }
  }

  resetearBuscador() {
    this.resetearFecha();
    this.buscador = '';
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarSalidas();
  }

  cargarSalidas() {
    this.salidaServices.getSalidasByEstadoPaginado(true, this.pageIndex, this.pageSize).subscribe((data) => {
      this.resetearFecha();
      this.salidas = data.content;
      setTimeout(() => {
        this.totalElementos = data.totalElements;
      });
      this.dataSource.data = this.salidas;
      this.carga.hide();
    },
    (error) => {
      this.carga.hide();
      this.snackbar.snackBarError(error.error.message || error.error);
    });
  }

  buscarSalidas() {
    if(!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;
    if (!this.fechaInicio || !this.fechaFin) {
      console.error('Debe seleccionar un rango de fechas');
      return;
    }

    if (this.fechaInicio && this.fechaFin) {
      this.salidaServices
        .getFiltradasSalidasPaginadas(this.fechaInicio, this.fechaFin, this.tipoBusqueda, this.buscador, this.pageIndex, this.pageSize)
        .subscribe((data) => {
          this.salidas = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSource.data = this.salidas;
        });
    } else {
      // Podrías notificar al usuario que debe rellenar ambas fechas.
      alert('Por favor, ingresa fecha de inicio y fecha fin.');
    }
  }

  resetearFecha() {
    const hoy = new Date();
    this.fechaFin = hoy.toISOString().split('T')[0];
    
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 2);
    this.fechaInicio = primerDiaMes.toISOString().split('T')[0];
  }
}
