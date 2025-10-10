import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Mueble } from 'src/app/models/mueble.model';
import { ProductoMueble } from 'src/app/models/productoMueble.model';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { RoleService } from 'src/app/services/role.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-detalles-muebles',
  templateUrl: './detalles-muebles.component.html',
  styleUrls: [
    '../../../assets/styles/modal.css', 
    './detalles-muebles.component.css',
  ],
})
export class DetallesMueblesComponent implements OnInit {
  mostrarModal: boolean = false;
  @Input() enRealizados: boolean = true;
  @Input() mueble!: Mueble;
  @Output() muebleRelleno = new EventEmitter<boolean>();
  currentPath: String = window.location.pathname;
  isAdmin: boolean = false;
  modoEdicion: boolean = false;
  
  constructor(
    private carga: PantallaCargaService,
    private productoService: ProductoServices,
    private roleService: RoleService
  ) {}

  ngOnInit() {
    this.roleService.hasRole('ROLE_ADMIN').subscribe(isAdmin => {
      this.isAdmin = isAdmin;
    });

    if (!this.enRealizados) {
      this.iniciarMuebles();
    }
  }

  iniciarMuebles() {
    this.validarYEmitirEstado();
  }

  mostrarDetalles() {
    this.modoEdicion = false;
    this.mostrarModal = true;
  }

  mostrarEdicion() {
    this.modoEdicion = true;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.modoEdicion = false;
  }

  obtenerDestino(): string {
    if (this.mueble.perfumeria) {
      let destino = this.mueble.perfumeria;
      if (this.mueble.pdv) {
        destino += ' - ' + this.mueble.pdv;
      }
      return destino;
    } else if (this.mueble.colaborador) {
      return this.mueble.colaborador;
    } else if (this.mueble.otroDestino) {
      return this.mueble.otroDestino;
    }
    return 'No especificado';
  }

  obtenerProductosRetirada(): ProductoMueble[] {
    if (!this.mueble.productos) return [];
    return this.mueble.productos.filter(p => p.esRetirada);
  }

  obtenerProductosImplantacion(): ProductoMueble[] {
    if (!this.mueble.productos) return [];
    return this.mueble.productos.filter(p => !p.esRetirada);
  }

  todosLosCamposRellenos(): boolean {
    return !!(
      this.mueble.fechaOrdenTrabajo &&
      this.mueble.fechaAsignacion &&
      this.mueble.tipoAccion &&
      this.mueble.presupuesto !== null &&
      this.mueble.presupuesto !== undefined &&
      this.mueble.costeColaborador !== null &&
      this.mueble.costeColaborador !== undefined &&
      this.mueble.costeEnvio !== null &&
      this.mueble.costeEnvio !== undefined &&
      this.mueble.productos &&
      this.mueble.productos.length > 0 &&
      this.mueble.productos.every(p => p.ref && p.description && p.estado && p.unidades)
    );
  }

  private validarYEmitirEstado() {
    const tipoAccion = this.mueble.tipoAccion;
    
    if (tipoAccion === 'RETIRADA') {
      this.muebleRelleno.emit(this.todosLosCamposRellenos());
      return;
    }

    if (tipoAccion === 'IMPLANTACION' || tipoAccion === 'INTERCAMBIO') {
      if (!this.todosLosCamposRellenos()) {
        this.muebleRelleno.emit(false);
        return;
      }

      const validacionesStock = this.mueble.productos
        ?.filter(p => !p.esRetirada)
        .filter(p => p.ref !== 'VISUAL' && p.ref !== 'SIN REFERENCIA')
        .map(producto => 
          this.productoService.getProductoPorReferenciaYEstado(producto.ref!, producto.estado!)
            .pipe(
              catchError(error => {
                console.error('Error al validar stock:', error);
                return of(null);
              })
            )
        ) || [];

      if (validacionesStock.length === 0) {
        this.muebleRelleno.emit(true);
        return;
      }

      forkJoin(validacionesStock).subscribe(productos => {
        const productosImplantacion = this.mueble.productos?.filter(p => !p.esRetirada) || [];
        let stockSuficiente = true;

        productos.forEach((productoStock, index) => {
          if (productoStock && productosImplantacion[index]) {
            const unidadesSolicitadas = productosImplantacion[index].unidades || 0;
            const stockDisponible = productoStock.stock || 0;

            if (unidadesSolicitadas > stockDisponible) {
              stockSuficiente = false;
            }
          }
        });

        this.muebleRelleno.emit(stockSuficiente);
      });
    }
  }
}