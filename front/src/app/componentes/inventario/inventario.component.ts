import { Component, OnInit } from '@angular/core';
import { dcs } from 'src/app/models/dcs.model';
import { Producto } from 'src/app/models/producto.model';
import { DCSService } from 'src/app/services/dcs.service';
import { ProductoServices } from 'src/app/services/producto.service';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css', '../detalles-entradas/detalles-entradas.component.css']
})
export class InventarioComponent implements OnInit{
  productos: Producto[] = [];
  DCSs: dcs[] = [];

  constructor(private productoService: ProductoServices, private dcsService: DCSService){}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarDcs();
  }
  
  cargarProductos() {
    this.productoService.getProductosOrdenadosPorReferencia().subscribe(
        (data: Producto[]) => {
          this.productos = data;
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

}
