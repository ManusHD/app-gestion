import { Component, OnInit } from '@angular/core';
import { Producto } from 'src/app/models/producto.model';
import { ProductoService } from 'src/app/services/producto.service';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css', '../detalles-entradas/detalles-entradas.component.css']
})
export class InventarioComponent implements OnInit{
  productos: Producto[] = [];

  constructor(private productoService: ProductoService){}

  ngOnInit(): void {
    this.cargarProductos();
  }
  
  cargarProductos() {
    this.productoService.getProductos().subscribe(
        (data: Producto[]) => {
          this.productos = data;
        }
    );
  }

}
