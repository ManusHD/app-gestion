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
  styleUrls: ['./inventario.component.css', '../../../assets/styles/paginator.css']
})
export class InventarioComponent implements OnInit{
  productos: Producto[] = [];
  DCSs: dcs[] = [];
  ubicaciones: Ubicacion[] = [];

  columnasPaginator: string[] = ['referencia', 'description', 'stock'];
  dataSource = new MatTableDataSource<Producto>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private productoService: ProductoServices, private dcsService: DCSService, private ubiService: UbicacionService){}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarDcs();
    this.cargarUbicaciones();
  }
  
  cargarProductos() {
    this.productoService.getProductosOrdenadosPorReferencia().subscribe(
      (data: Producto[]) => {
        this.productos = data;
        this.dataSource.data = this.productos;
        this.dataSource.paginator = this.paginator; // Vincula el paginador
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
        // console.log(this.ubicaciones);
      }
    );
  }

}
