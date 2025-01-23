import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Entrada } from 'src/app/models/entrada.model';
import { EntradaServices } from 'src/app/services/entrada.service';

@Component({
  selector: 'app-entradas-recibidas',
  templateUrl: './entradas-recibidas.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './entradas-recibidas.component.css', 
  ]
})
export class EntradasRecibidasComponent implements OnInit{
  entradas: Entrada[] = [];
  columnasPaginator:string[] = ['fechaRecepcion', 'origen', 'dcs', 'detalles'];
  dataSource = new MatTableDataSource<Entrada>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private entradaServices: EntradaServices) {}

  ngOnInit(): void {
      this.cargarEntradas();
  }

  cargarEntradas() {
    this.entradaServices.getEntradasByEstadoOrderByFechaRecepcion(true).subscribe((data: Entrada[]) => {
      this.entradas = data;
      this.dataSource.data = this.entradas;
      this.dataSource.paginator = this.paginator;
      console.log(this.entradas);
    });
  }
}
