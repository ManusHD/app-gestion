import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { dcs } from 'src/app/models/dcs.model';
import { Producto } from 'src/app/models/producto.model';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { DCSService } from 'src/app/services/dcs.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { UbicacionService } from 'src/app/services/ubicacion.service';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['../../../assets/styles/paginator.css', './inventario.component.css', ]
})
export class InventarioComponent implements OnInit{
  productos: Producto[] = [];
  DCSs: dcs[] = [];
  ubicaciones: Ubicacion[] = [];
  buscador: string = '';
  productosBuscados: Producto[] = [];

  columnasStock: string[] = ['referencia', 'description', 'stock'];
  dataSourceStock = new MatTableDataSource<Producto>();
  @ViewChild(MatPaginator) paginatorStock!: MatPaginator;

  columnasProductosBuscados: string[] = ['referencia', 'description', 'stock'];
  dataSourceProductosBuscados = new MatTableDataSource<Producto>();
  @ViewChild(MatPaginator) paginatorProductosBuscados!: MatPaginator;

  constructor(private productoService: ProductoServices, private dcsService: DCSService, private ubiService: UbicacionService){}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarDcs();
    this.cargarUbicaciones();
  }

  buscarProducto() {
    this.productoService.getProductosPorReferencia(this.buscador).subscribe(
      (data: Producto[]) => {
        this.productosBuscados = data;
        this.dataSourceProductosBuscados.data = this.productosBuscados;
        this.dataSourceProductosBuscados.paginator = this.paginatorProductosBuscados;
        console.log(this.productosBuscados);
      }
    );
  }

  resetearBuscador() {
    this.buscador = '';
    this.productosBuscados = [];
  }
  
  cargarProductos() {
    this.productoService.getProductosOrdenadosPorReferencia().subscribe(
      (data: Producto[]) => {
        this.productos = data;
        this.dataSourceStock.data = this.productos;
        this.dataSourceStock.paginator = this.paginatorStock; // Vincula el paginador
      }
    );
  }

  cargarDcs() {
    this.dcsService.getDCSs().subscribe(
      (data: dcs[]) => {
        this.DCSs = data;
      }
    )
  }

  cargarUbicaciones() {
    this.ubiService.getUbicacionesOrderByNombre().subscribe(
      (data: Ubicacion[]) => {
        this.ubicaciones = data;
      }
    );
  }
}
