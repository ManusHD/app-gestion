import { Component, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Producto } from 'src/app/models/producto.model';
import { ProductoServices } from 'src/app/services/producto.service';

@Component({
  selector: 'app-nuevo-producto',
  templateUrl: './nuevo-producto.component.html',
  styleUrls: ['./nuevo-producto.component.css'],
})
export class NuevoProductoComponent {
  // private snackBar = inject(MatSnackBar);
  // producto: Producto = new Producto();
  // referenciaPattern = '^(\\d{1,7}|R\\d{7})$';
  // existe: boolean = false;

  // constructor(private productosService: ProductoServices) {}

  // existeRef() {
  //   console.log(this.producto.referencia);
  //   this.productosService
  //     .getProductoPorReferencia(this.producto.referencia!)
  //     .subscribe((data: Producto) => {
  //       if (data != null) {
  //         this.existe = true;
  //         console.log("Existe: ", this.existe);
  //       } else {
  //         this.existe = false;
  //         console.log("NO existe: ", this.existe);
  //       }
  //     });
  // }

  // onSubmit() {
  //   if (!this.existe) {
  //     console.log('Producto a enviar: ', this.producto);
  //     this.productosService.postProducto(this.producto).subscribe({
  //       next: (data) => {
  //         console.log('Producto creado correctamente: ', data);
  //         this.snackBar.open('Producto guardado correctamente', '✖', {
  //           duration: 3000,
  //           panelClass: 'exito',
  //         });
  //         location.reload();
  //       },
  //       error: (error) => {
  //         console.error('Error al crear producto', error);
  //         this.snackBar.open(error.error.message || error, '✖', {
  //           duration: 3000,
  //           panelClass: 'error',
  //         });
  //       },
  //     });
  //   }else{
  //     this.snackBar.open('Ya existe el producto con esta referencia', '✖', {
  //       duration: 3000,
  //       panelClass: 'error'
  //     });
  //   }
  // }
}
