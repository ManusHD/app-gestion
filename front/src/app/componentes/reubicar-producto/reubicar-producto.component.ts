import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { finalize, Subject } from 'rxjs';
import { Producto } from 'src/app/models/producto.model';
import { ProductoUbicacion } from 'src/app/models/productoUbicacion.model';
import { ReubicacionRequest } from 'src/app/models/ReubicacionRequest.model';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { SnackBar } from 'src/app/services/snackBar.service';
import { UbicacionService } from 'src/app/services/ubicacion.service';

@Component({
  selector: 'app-reubicar-producto',
  templateUrl: './reubicar-producto.component.html',
  styleUrls: [
    '../../../assets/styles/modal.css',
    './reubicar-producto.component.css',
  ],
})
export class ReubicarProductoComponent implements OnInit {
  mostrarModal: boolean = false;
  @Input() productoActual!: ProductoUbicacion;
  @Input() ubicacionActual!: String;
  @Input() tipoReubicacion?: String | null;
  @Input() productosPalet?: ProductoUbicacion[] = [];
  ubicaciones: String[] = [];
  productoReubicado: ProductoUbicacion = new ProductoUbicacion();
  ubicacionDestino!: String;
  reubicacion!: ReubicacionRequest;
  btnSubmitActivado = true;

  reubicaciones: ReubicacionRequest[] = [];
  reubicando = false;
  progresoActual = 0;
  productosReubicadosOK = 0;
  productosConError = 0;
  reubicacionCompletada = false;
  @Output() reubicacionCompletadaOutput = new EventEmitter<boolean>();

  constructor(
    private ubiService: UbicacionService,
    private snackbar: SnackBar
  ) {}

  ngOnInit(): void {
    this.cargarUbicaciones();
  }

  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;

    if(this.reubicacionCompletada) {
      location.reload();
    }
  }

  reubicarProducto() {
    this.btnSubmitActivado = false;
    this.productoReubicado.ref = this.productoActual.ref;
    this.productoReubicado.description = this.productoActual.description;
    this.reubicacion = {
      producto: this.productoReubicado,
      origen: this.ubicacionActual,
      destino: this.ubicacionDestino,
    };
    this.ubiService.reubicar(this.reubicacion).subscribe(
      (data) => {
        console.log('Reubicación Recibida', data);
        this.snackbar.snackBarExito('Producto reubicado correctamente');
        console.log(data);
        location.reload();
      },
      (error) => {
        this.snackbar.snackBarError(error.error);
        console.error('Error al reubicar', error);
        this.btnSubmitActivado = true;
      }
    );
  }

  reubicarPalet() {
    this.reubicarProductos();
  }

  cargarProductosReubicacion() {
    this.reubicaciones = this.productosPalet!.map((row) => {
      const reubicacionRequest = new ReubicacionRequest();
      const producto: ProductoUbicacion = {
        ref: row.ref,
        description: row.description,
        unidades: row.unidades,
      };

      reubicacionRequest.producto = producto;
      reubicacionRequest.origen = this.ubicacionActual;
      reubicacionRequest.destino = this.ubicacionDestino;

      return reubicacionRequest;
    });

    this.reubicacionCompletada = false;
    this.progresoActual = 0;
    this.productosReubicadosOK = 0;
    this.productosConError = 0;
  }

  reubicarProductos() {
    if (this.reubicaciones.length === 0) return;

    this.reubicando = true;
    this.progresoActual = 0;
    this.productosReubicadosOK = 0;
    this.productosConError = 0;

    this.reubicarSiguienteProducto();
  }

  reubicarSiguienteProducto() {
    if (this.progresoActual >= this.reubicaciones.length) {
      this.finalizarReubicacion();
      return;
    }

    const reubicacionActual = this.reubicaciones[this.progresoActual];

    this.ubiService
      .reubicar(reubicacionActual)
      .pipe(
        finalize(() => {
          this.progresoActual++;
          // Continuar con el siguiente PDV
          setTimeout(() => this.reubicarSiguienteProducto(), 100); // Pequeño delay para evitar sobrecarga
        })
      )
      .subscribe({
        next: (response) => {
          this.productosReubicadosOK++;
        },
        error: (error) => {
          console.error('Error al reubicar un producto:', error);
          this.productosConError++;
        },
      });
  }

  finalizarReubicacion() {
    this.reubicando = false;
    this.reubicacionCompletada = true;

    if (this.productosConError === 0) {
      this.snackbar.snackBarExito(
        `Se han importado ${this.productosReubicadosOK} artículos correctamente`
      );
    } else {
      this.snackbar.snackBarError(
        `Importación con errores: ${this.productosReubicadosOK} artículos correctos, ${this.productosConError} con errores`
      );
    }

    this.reubicacionCompletadaOutput.emit(this.reubicacionCompletada);
  }

  cancelarReubicacion(): void {
    if (this.reubicando) {
      // Si está en proceso, cancelamos
      this.reubicando = false;
      this.snackbar.snackBarError('Importación cancelada');
    }

    // Limpiar los datos
    this.reubicaciones = [];
    this.reubicacionCompletada = false;
  }

  cargarUbicaciones() {
    this.ubiService
      .getUbicacionesOrderByNombre()
      .subscribe((data: Ubicacion[]) => {
        this.ubicaciones = data
          .filter((ubicacion) => ubicacion.nombre != this.ubicacionActual)
          .map((ubicacion) => ubicacion.nombre!);
      });
  }
}
