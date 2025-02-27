import { Component, Input, OnInit } from '@angular/core';
import { ProductoUbicacion } from 'src/app/models/productoUbicacion.model';
import { ReubicacionRequest } from 'src/app/models/ReubicacionRequest.model';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { SnackBar } from 'src/app/services/snackBar.service';
import { UbicacionService } from 'src/app/services/ubicacion.service';

@Component({
  selector: 'app-reubicar-producto',
  templateUrl: './reubicar-producto.component.html',
  styleUrls: ['../../../assets/styles/modal.css', './reubicar-producto.component.css']
})
export class ReubicarProductoComponent implements OnInit{
  mostrarModal: boolean = false;
  @Input() productoActual!: ProductoUbicacion;
  @Input() ubicacionActual!: String;
  ubicaciones: String[] = [];
  productoReubicado: ProductoUbicacion = new ProductoUbicacion();
  ubicacionDestino!: String;
  reubicacion!: ReubicacionRequest;
  btnSubmitActivado = true;

  constructor(private ubiService: UbicacionService, private snackBar: SnackBar) {}

  ngOnInit(): void {
      this.cargarUbicaciones();
  }

  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  reubicarProducto() {
    this.btnSubmitActivado = false;
    this.productoReubicado.ref = this.productoActual.ref;
    this.productoReubicado.description = this.productoActual.description;
    this.reubicacion = {
      producto: this.productoReubicado,
      origen: this.ubicacionActual,
      destino: this.ubicacionDestino
    }
    this.ubiService.reubicar(this.reubicacion).subscribe(
      (data) => {
        console.log("Reubicación Recibida", data);
        this.snackBar.snackBarExito("Producto reubicado correctamente");
        console.log(data);
        location.reload();
      },
      (error) => {
        this.snackBar.snackBarError(error.error);
        console.error("Error al reubicar", error);
        this.btnSubmitActivado = true;
      }
    );
  }
  
  cargarUbicaciones() {
    this.ubiService.getUbicacionesOrderByNombre().subscribe(
      (data: Ubicacion[]) => {
        this.ubicaciones = data.filter(ubicacion => ubicacion.nombre != this.ubicacionActual).map((ubicacion) => ubicacion.nombre!);
      });
  }

}
