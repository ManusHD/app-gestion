import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Entrada } from 'src/app/models/entrada.model';
import { Salida } from 'src/app/models/salida.model';
import { SalidaServices } from 'src/app/services/salida.service';

@Component({
  selector: 'app-salidas-enviadas',
  templateUrl: './salidas-enviadas.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './salidas-enviadas.component.css', 
  ]
})
export class SalidasEnviadasComponent {
  salidas: Salida[] = [];
    columnasPaginator:string[] = ['fechaEnvio', 'destino', 'detalles'];
    dataSource = new MatTableDataSource<Salida>();
    @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private salidaServices: SalidaServices) {}

  ngOnInit(): void {
      this.cargarSalidas();
  }

  cargarSalidas() {
    this.salidaServices.getSalidasByEstado(true).subscribe((data: Salida[]) => {
      this.salidas = data;
      this.dataSource.data = this.salidas;
      this.dataSource.paginator = this.paginator;
    });
  }
}
