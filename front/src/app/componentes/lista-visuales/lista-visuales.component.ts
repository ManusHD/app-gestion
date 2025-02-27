import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Producto } from 'src/app/models/producto.model';
import { ProductoServices } from 'src/app/services/producto.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-lista-visuales',
  templateUrl: './lista-visuales.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './lista-visuales.component.css'
  ],
})
export class ListaVisualesComponent implements OnInit {
  currentPath = window.location.pathname;
  productos: Producto[] = [];
  buscador: string = '';
  tipoBusqueda: string = 'referencias';
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  buscando: boolean = false;

  columnasStock: string[] = ['referencia', 'description', 'stock'];
  dataSourceStock = new MatTableDataSource<Producto>();
  @ViewChild(MatPaginator) paginatorStock!: MatPaginator;

  constructor(
    private productoService: ProductoServices,
    private snackBar: SnackBar
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      this.buscarProductos();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }
      
  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    if(this.buscando){
      this.buscarProductos();
    } else {
      this.cargarProductos();         
    }
  }

  buscarProductos() {
    if(!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;
    this.productoService
      .getVisualesPorDescripcionPaginado(this.buscador, this.pageIndex, this.pageSize)
      .subscribe((data) => {
        this.productos = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSourceStock.data = this.productos;
      });
  }

  resetearBuscador() {
    this.buscador = '';
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarProductos();
  }

  cargarProductos() {
    this.productoService.getVisualesPaginado(this.pageIndex, this.pageSize).subscribe((data) => {
      this.productos = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSourceStock.data = this.productos;
    });
  }
}
