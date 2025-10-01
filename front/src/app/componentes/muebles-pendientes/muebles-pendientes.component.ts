import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { catchError, forkJoin, of, throwError } from 'rxjs';
import { Mueble } from 'src/app/models/mueble.model';
import { MuebleService } from 'src/app/services/mueble.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SnackBar } from 'src/app/services/snackBar.service';
import { ProductoServices } from 'src/app/services/producto.service';

@Component({
  selector: 'app-muebles-pendientes',
  templateUrl: './muebles-pendientes.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './muebles-pendientes.component.css',
  ],
})
export class MueblesPendientesComponent implements OnInit {
  muebles: Mueble[] = [];
  columnasPaginator: string[] = ['fechaOrden', 'destino', 'tipoAccion', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Mueble>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  btnSubmitActivado = true;
  
  // Mapa para almacenar el estado de cada mueble
  estadosMuebles: Map<number, boolean> = new Map();

  constructor(
    private muebleService: MuebleService,
    private productoService: ProductoServices,
    private carga: PantallaCargaService,
    private snackbar: SnackBar
  ) {}

  ngOnInit() {
    this.cargarMuebles();
  }
    
  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarMuebles();
  }

  cargarMuebles() {
    this.carga.show();
    this.muebleService
      .getMueblesByEstadoPaginado(false, this.pageIndex, this.pageSize)
      .subscribe((data) => {
        this.muebles = data.content;
        setTimeout(() => {
          this.totalElementos = data.totalElements;
        });
        this.dataSource.data = this.muebles;
        
        // Validar el estado de completitud de cada mueble
        this.validarEstadosMuebles();
        
        this.carga.hide();
        console.log(this.muebles)
      },
      (error) => {
        this.carga.hide();
        this.snackbar.snackBarError(error.error.message || error.error);
        console.error(error);
      });
  }

  validarEstadosMuebles() {
    this.muebles.forEach(mueble => {
      if (mueble.tipoAccion === 'IMPLANTACION' || mueble.tipoAccion === 'INTERCAMBIO') {
        this.validarStockMueble(mueble);
      } else {
        // Para RETIRADA, solo validar campos básicos
        this.estadosMuebles.set(mueble.id!, this.estaCompletoBasico(mueble));
      }
    });
  }

  validarStockMueble(mueble: Mueble) {
    if (!this.estaCompletoBasico(mueble)) {
      this.estadosMuebles.set(mueble.id!, false);
      return;
    }

    // Validar stock para productos de implantación
    const validacionesStock = mueble.productos
      ?.filter(p => !p.esRetirada) // Solo productos de implantación
      .filter(p => p.ref !== 'VISUAL' && p.ref !== 'SIN REFERENCIA') // Excluir especiales
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
      // No hay productos que validar (todos son especiales o de retirada)
      this.estadosMuebles.set(mueble.id!, true);
      return;
    }

    forkJoin(validacionesStock).subscribe(productos => {
      const productosImplantacion = mueble.productos?.filter(p => !p.esRetirada) || [];
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

      this.estadosMuebles.set(mueble.id!, stockSuficiente);
    });
  }

  estaCompletoBasico(mueble: Mueble): boolean {
    return !!(
      mueble.fechaOrdenTrabajo &&
      mueble.fechaAsignacion &&
      mueble.fechaPrevistaRealizacion &&
      mueble.tipoAccion &&
      mueble.presupuesto !== null &&
      mueble.presupuesto !== undefined &&
      mueble.costeColaborador !== null &&
      mueble.costeColaborador !== undefined &&
      mueble.costeEnvio !== null &&
      mueble.costeEnvio !== undefined &&
      mueble.productos &&
      mueble.productos.length > 0 &&
      mueble.productos.every(p => p.ref && p.description && p.estado && p.unidades)
    );
  }

  estaCompleto(mueble: Mueble): boolean {
    return this.estadosMuebles.get(mueble.id!) || false;
  }

  marcarComoRealizado(id: number) {
    const mueble = this.muebles.find(m => m.id === id);
    
    // Validar que tiene fecha prevista de realización
    if (!mueble?.fechaPrevistaRealizacion) {
      this.snackbar.snackBarError('Debe establecer una fecha prevista de realización antes de marcar como realizado');
      return;
    }
    
    // Validar que todos los costes están definidos
    if (mueble.costeColaborador === null || mueble.costeColaborador === undefined ||
        mueble.costeEnvio === null || mueble.costeEnvio === undefined) {
      this.snackbar.snackBarError('Debe completar todos los costes antes de marcar como realizado');
      return;
    }
    
    // Validar que está completo (incluyendo validación de stock)
    if (!this.estaCompleto(mueble)) {
      this.snackbar.snackBarError('El trabajo no está completo o tiene problemas de stock insuficiente');
      return;
    }
    
    this.btnSubmitActivado = false;
    this.carga.show();
    this.muebleService
      .marcarComoRealizado(id)
      .pipe(
        catchError((error) => {
          this.snackbar.snackBarError(error.error.message || error.error);
          this.carga.hide();
          this.btnSubmitActivado = true;
          return throwError(error);
        })
      )
      .subscribe((data) => {
        this.cargarMuebles();
        this.carga.hide();
        console.log('Trabajo marcado como realizado');
        this.snackbar.snackBarExito('Trabajo marcado como realizado. Se ha generado automáticamente la previsión de ' + (data.tipoAccion === 'IMPLANTACION' ? 'salida' : (data.tipoAccion === 'RETIRADA' ? 'entrada' : 'entrada y salida')));
        this.btnSubmitActivado = true;
      }),
      (error: any) => {
        this.carga.hide();
        this.btnSubmitActivado = true;
        this.snackbar.snackBarError(error.error.message || error.error);
        console.error(error);
      };
  }

  deleteMueble(idMueble: number) {
    this.carga.show();
    this.btnSubmitActivado = false;
    this.muebleService.deleteMueble(idMueble).subscribe(
      (data: Mueble) => {
        this.cargarMuebles();
        this.carga.hide();
        console.log('Trabajo borrado con éxito');
        this.snackbar.snackBarExito('Trabajo borrado con éxito');
        this.btnSubmitActivado = true;
      },
      (error) => {
        this.carga.hide();
        this.btnSubmitActivado = true;
        console.error(error);
        this.snackbar.snackBarError('No se puede borrar el trabajo por un conflicto en la BBDD');
      }
    );
  }

  obtenerDestino(mueble: Mueble): string {
    if (mueble.perfumeria) {
      let destino = mueble.perfumeria;
      if (mueble.pdv) {
        destino += ' - ' + mueble.pdv;
      }
      return destino;
    } else if (mueble.colaborador) {
      return mueble.colaborador;
    } else if (mueble.otroDestino) {
      return mueble.otroDestino;
    }
    return 'No especificado';
  }
}