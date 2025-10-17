import { Injectable } from '@angular/core';
import { FormArray, FormGroup, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Ubicacion } from '../models/ubicacion.model';
import { ProductoServices } from './producto.service';
import { UbicacionService } from './ubicacion.service';

interface StockInfo {
  stockTotal: number;
  unidadesEnUso: number;
  stockDisponible: number;
}

interface StockEnviosInfo {
  stockTotal: number;
  unidadesEnUsoOtros: number;
  stockDisponible: number;
}

interface DivisionInfo {
  lineaOrigen: number;
  unidadesDivididas: number;
  refProducto: string;
  estadoProducto: string;
}

@Injectable()
export class StockManagerService {
  // Cache de stock
  private stockDisponibleCache = new Map<string, number>();
  private stockRealCache = new Map<string, StockInfo>();
  private stockEnviosCache = new Map<string, StockEnviosInfo>();

  // Ubicaciones por producto y estado
  private ubicacionesPorProductoYEstado = new Map<string, Ubicacion[]>();
  private ubicacionesPorProducto = new Map<string, Ubicacion[]>();

  // Estados disponibles por producto
  private estadosDisponiblesPorProducto = new Map<number, string[]>();

  // Divisiones realizadas
  private divisionesRealizadas = new Map<number, DivisionInfo>();
  private lineasProcesadas = new Set<number>();

  constructor(
    private productoService: ProductoServices,
    private ubicacionService: UbicacionService
  ) {}

  // ============================================
  // GESTIÓN DE UBICACIONES
  // ============================================

  cargarUbicacionesPorReferenciaYEstado(
    referencia: string,
    estado: string,
    index: number
  ): Observable<Ubicacion[]> {
    const key = `${referencia}-${estado}`;

    if (this.ubicacionesPorProductoYEstado.has(key)) {
      return of(this.ubicacionesPorProductoYEstado.get(key)!);
    }

    return this.ubicacionService.getUbicacionesByReferenciaAndEstado(referencia, estado).pipe(
      tap(ubicaciones => {
        this.ubicacionesPorProductoYEstado.set(key, ubicaciones);
      })
    );
  }

  cargarUbicacionesProductoEspecial(ref: string, descripcion: string): Observable<Ubicacion[]> {
    if (this.ubicacionesPorProducto.has(descripcion)) {
      return of(this.ubicacionesPorProducto.get(descripcion)!);
    }

    return this.ubicacionService.getUbicacionesByDescripcionProducto(descripcion).pipe(
      tap(ubicaciones => {
        this.ubicacionesPorProducto.set(descripcion, ubicaciones);
      })
    );
  }

  getUbicacionesPorIndice(
    productos: FormArray,
    index: number,
    esProductoEspecial: (ref: string) => boolean
  ): Ubicacion[] {
    const producto = productos.at(index);
    const referencia = producto.get('ref')?.value;
    const estado = producto.get('estado')?.value;
    const descripcion = producto.get('description')?.value;

    if (esProductoEspecial(referencia)) {
      return this.ubicacionesPorProducto.get(descripcion) || [];
    } else if (referencia && estado) {
      const key = `${referencia}-${estado}`;
      return this.ubicacionesPorProductoYEstado.get(key) || [];
    }

    return [];
  }

  // ============================================
  // GESTIÓN DE ESTADOS
  // ============================================

  setEstadosDisponibles(index: number, estados: string[]): void {
    this.estadosDisponiblesPorProducto.set(index, estados);
  }

  getEstadosDisponibles(index: number): string[] | undefined {
    return this.estadosDisponiblesPorProducto.get(index);
  }

  clearEstadosDisponibles(index: number): void {
    this.estadosDisponiblesPorProducto.delete(index);
  }

  // ============================================
  // VALIDACIÓN DE STOCK
  // ============================================

  validarStockEspecifico(
    index: number,
    referencia: string,
    estado: string,
    ubicacion: string,
    currentPath: string,
    salidaActualId: number | null,
    esProductoEspecial: (ref: string) => boolean
  ): Observable<void> {
    if (esProductoEspecial(referencia)) {
      return of(void 0);
    }

    const key = `${index}-${referencia}-${estado}-${ubicacion}`;

    if (currentPath.includes('/salidas/pendientes')) {
      return this.productoService.getStockDisponibleReal(referencia, estado, ubicacion).pipe(
        tap(stockInfo => {
          this.stockRealCache.set(key, stockInfo);
          this.stockDisponibleCache.set(key, stockInfo.stockDisponible);
        }),
        map(() => void 0) // ✅ Transformar a void
      );
    } else if (currentPath.includes('/salidas/envios') && salidaActualId) {
      return this.productoService
        .getStockDisponibleEnvios(referencia, estado, ubicacion, salidaActualId)
        .pipe(
          tap(stockInfo => {
            this.stockEnviosCache.set(key, stockInfo);
            this.stockDisponibleCache.set(key, stockInfo.stockDisponible);
          }),
          map(() => void 0) // ✅ Transformar a void
        );
    } else {
      const stockDisponible = this.obtenerStockEspecifico(referencia, estado, ubicacion);
      this.stockDisponibleCache.set(key, stockDisponible);
      return of(void 0);
    }
  }

  obtenerStockEspecifico(referencia: string, estado: string, ubicacionNombre: string): number {
    const key = `${referencia}-${estado}`;
    const ubicaciones = this.ubicacionesPorProductoYEstado.get(key) || [];

    const ubicacionEncontrada = ubicaciones.find(ubi => ubi.nombre === ubicacionNombre);
    if (!ubicacionEncontrada) {
      return 0;
    }

    const productoEnUbicacion = ubicacionEncontrada.productos?.find(
      p => p.ref === referencia && p.estado === estado
    );

    return productoEnUbicacion?.unidades || 0;
  }

  getStockDisponible(
    index: number,
    referencia: string,
    estado: string,
    ubicacion: string
  ): number {
    const key = `${index}-${referencia}-${estado}-${ubicacion}`;
    return this.stockDisponibleCache.get(key) || 0;
  }

  unidadesExcedenStock(
    productos: FormArray,
    index: number,
    esProductoEspecial: (ref: string) => boolean
  ): boolean {
    const producto = productos.at(index);
    const unidades = producto.get('unidades')?.value || 0;
    const referencia = producto.get('ref')?.value;
    const estado = producto.get('estado')?.value;
    const ubicacion = producto.get('ubicacion')?.value;

    if (!referencia || !estado || !ubicacion || esProductoEspecial(referencia)) {
      return false;
    }

    const stockDisponible = this.getStockDisponible(index, referencia, estado, ubicacion);
    return unidades > stockDisponible;
  }

  getMensajeStock(
    index: number,
    referencia: string,
    estado: string,
    ubicacion: string,
    currentPath: string,
    esProductoEspecial: (ref: string) => boolean
  ): string {
    if (esProductoEspecial(referencia)) {
      return '';
    }

    const key = `${index}-${referencia}-${estado}-${ubicacion}`;

    if (currentPath.includes('/salidas/pendientes') && this.stockRealCache.has(key)) {
      const stockInfo = this.stockRealCache.get(key)!;
      if (stockInfo.unidadesEnUso > 0) {
        return `Stock disponible: ${stockInfo.stockDisponible} (${stockInfo.unidadesEnUso} en envíos pendientes)`;
      }
      return `Stock disponible: ${stockInfo.stockDisponible}`;
    } else if (currentPath.includes('/salidas/envios') && this.stockEnviosCache.has(key)) {
      const stockInfo = this.stockEnviosCache.get(key)!;
      if (stockInfo.unidadesEnUsoOtros > 0) {
        return `Stock disponible: ${stockInfo.stockDisponible} (${stockInfo.unidadesEnUsoOtros} en otros envíos)`;
      }
      return `Stock disponible: ${stockInfo.stockDisponible}`;
    } else {
      const stockDisponible = this.getStockDisponible(index, referencia, estado, ubicacion);
      return `Stock disponible: ${stockDisponible}`;
    }
  }

  // ============================================
  // ACTUALIZACIÓN DE VALIDADORES
  // ============================================

  actualizarValidadoresUnidades(
    productos: FormArray,
    index: number,
    esProductoEspecial: (ref: string) => boolean
  ): void {
    const producto = productos.at(index);
    const unidadesControl = producto.get('unidades');
    const referencia = producto.get('ref')?.value;
    const estado = producto.get('estado')?.value;
    const ubicacion = producto.get('ubicacion')?.value;

    if (!unidadesControl) return;

    if (referencia && estado && ubicacion && !esProductoEspecial(referencia)) {
      const stockDisponible = this.getStockDisponible(index, referencia, estado, ubicacion);

      unidadesControl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(stockDisponible)
      ]);
    } else {
      unidadesControl.setValidators([Validators.required, Validators.min(1)]);
    }

    unidadesControl.updateValueAndValidity();
  }

  // ============================================
  // DIVISIÓN AUTOMÁTICA DE UNIDADES
  // ============================================

  dividirUnidadesAutomaticamente(
    productos: FormArray,
    index: number,
    esProductoEspecial: (ref: string) => boolean,
    mostrarMensaje: (mensaje: string) => void
  ): void {
    const productoActual = productos.at(index);
    const refActual = productoActual.get('ref')?.value;
    const estadoActual = productoActual.get('estado')?.value;
    const unidadesActuales = productoActual.get('unidades')?.value || 0;

    if (!refActual || esProductoEspecial(refActual) || !estadoActual) {
      return;
    }

    this.deshacerDivisionAnterior(productos, index);

    if (unidadesActuales <= 0) {
      return;
    }

    if (this.lineasProcesadas.has(index)) {
      return;
    }

    let lineaOrigenIndex = -1;
    let maxUnidades = 0;

    for (let i = 0; i < productos.length; i++) {
      if (i === index) continue;

      const control = productos.at(i);
      const ref = control.get('ref')?.value;
      const estado = control.get('estado')?.value;
      const unidades = control.get('unidades')?.value || 0;

      if (ref === refActual && estado === estadoActual && unidades > maxUnidades) {
        lineaOrigenIndex = i;
        maxUnidades = unidades;
      }
    }

    if (lineaOrigenIndex !== -1 && maxUnidades >= unidadesActuales) {
      const lineaOrigen = productos.at(lineaOrigenIndex);
      const nuevasUnidadesOrigen = maxUnidades - unidadesActuales;

      this.lineasProcesadas.add(index);

      this.divisionesRealizadas.set(index, {
        lineaOrigen: lineaOrigenIndex,
        unidadesDivididas: unidadesActuales,
        refProducto: refActual,
        estadoProducto: estadoActual
      });

      lineaOrigen.get('unidades')?.setValue(nuevasUnidadesOrigen);

      mostrarMensaje(
        `Se dividieron ${unidadesActuales} unidades de ${refActual} (${estadoActual}) desde la línea ${
          lineaOrigenIndex + 1
        }`
      );

      setTimeout(() => {
        this.lineasProcesadas.delete(index);
      }, 1000);
    }
  }

  private deshacerDivisionAnterior(productos: FormArray, index: number): void {
    const divisionAnterior = this.divisionesRealizadas.get(index);

    if (divisionAnterior) {
      if (divisionAnterior.lineaOrigen < productos.length) {
        const lineaOrigen = productos.at(divisionAnterior.lineaOrigen);
        const refOrigen = lineaOrigen.get('ref')?.value;
        const estadoOrigen = lineaOrigen.get('estado')?.value;

        if (
          refOrigen === divisionAnterior.refProducto &&
          estadoOrigen === divisionAnterior.estadoProducto
        ) {
          const unidadesActualesOrigen = lineaOrigen.get('unidades')?.value || 0;
          const nuevasUnidadesOrigen = unidadesActualesOrigen + divisionAnterior.unidadesDivididas;

          lineaOrigen.get('unidades')?.setValue(nuevasUnidadesOrigen);
        }
      }

      this.divisionesRealizadas.delete(index);
    }
  }

  mostrarInfoDivisionDetallada(
    productos: FormArray,
    index: number,
    esProductoEspecial: (ref: string) => boolean
  ): string {
    const productoActual = productos.at(index);
    const refActual = productoActual.get('ref')?.value;
    const estadoActual = productoActual.get('estado')?.value;

    if (!refActual || esProductoEspecial(refActual) || !estadoActual) {
      return '';
    }

    const division = this.divisionesRealizadas.get(index);
    if (division) {
      return `${division.unidadesDivididas} unidades tomadas de línea ${division.lineaOrigen + 1}`;
    }

    const totalDisponible = this.getTotalUnidadesDisponibles(
      productos,
      refActual,
      estadoActual,
      index
    );

    if (totalDisponible > 0 && this.hayLineasConMismaReferenciaYEstado(productos, index)) {
      return `${totalDisponible} unidades disponibles para dividir`;
    }

    return '';
  }

  private getTotalUnidadesDisponibles(
    productos: FormArray,
    refActual: string,
    estadoActual: string,
    indexExcluir: number
  ): number {
    let total = 0;

    for (let i = 0; i < productos.length; i++) {
      if (i === indexExcluir) continue;

      const control = productos.at(i);
      const ref = control.get('ref')?.value;
      const estado = control.get('estado')?.value;
      const unidades = control.get('unidades')?.value || 0;

      if (ref === refActual && estado === estadoActual) {
        total += unidades;
      }
    }

    return total;
  }

  private hayLineasConMismaReferenciaYEstado(productos: FormArray, index: number): boolean {
    const productoActual = productos.at(index);
    const refActual = productoActual.get('ref')?.value;
    const estadoActual = productoActual.get('estado')?.value;

    if (!refActual || !estadoActual) {
      return false;
    }

    for (let i = 0; i < productos.length; i++) {
      if (i === index) continue;

      const control = productos.at(i);
      const ref = control.get('ref')?.value;
      const estado = control.get('estado')?.value;

      if (ref === refActual && estado === estadoActual) {
        return true;
      }
    }

    return false;
  }

  actualizarIndicesDivision(indexEliminado: number): void {
    const divisionesActualizadas = new Map<number, DivisionInfo>();

    this.divisionesRealizadas.forEach((division, lineaIndex) => {
      if (lineaIndex > indexEliminado) {
        divisionesActualizadas.set(lineaIndex - 1, {
          ...division,
          lineaOrigen:
            division.lineaOrigen > indexEliminado
              ? division.lineaOrigen - 1
              : division.lineaOrigen
        });
      } else if (lineaIndex < indexEliminado) {
        divisionesActualizadas.set(lineaIndex, {
          ...division,
          lineaOrigen:
            division.lineaOrigen > indexEliminado
              ? division.lineaOrigen - 1
              : division.lineaOrigen
        });
      }
    });

    this.divisionesRealizadas = divisionesActualizadas;
  }

  // ============================================
  // LIMPIEZA
  // ============================================

  limpiarCache(): void {
    this.stockDisponibleCache.clear();
    this.stockRealCache.clear();
    this.stockEnviosCache.clear();
    this.ubicacionesPorProductoYEstado.clear();
    this.ubicacionesPorProducto.clear();
    this.estadosDisponiblesPorProducto.clear();
    this.divisionesRealizadas.clear();
    this.lineasProcesadas.clear();
  }

  limpiarStockProducto(index: number, referencia: string): void {
    // Limpiar todas las entradas relacionadas con este producto
    Array.from(this.stockDisponibleCache.keys())
      .filter(key => key.startsWith(`${index}-${referencia}-`))
      .forEach(key => {
        this.stockDisponibleCache.delete(key);
        this.stockRealCache.delete(key);
        this.stockEnviosCache.delete(key);
      });
  }
}