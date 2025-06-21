import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment-dev';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface FacturacionCalculada {
  totalAlmacenaje: number;
  totalMovimientos: number;
  totalGeneral: number;
  detallesAlmacenaje: DetalleAlmacenaje[];
  detallesMovimientos: DetalleMovimiento[];
  resumenMovimientos: ResumenMovimientos;
}

export interface ResumenMovimientos {
  stockInicialPalets: number;
  paletsEntrados: number;
  paletsSalidos: number;
  bultosEntrados: number;
  bultosSalidos: number;
  unidadesEntradas: number;
  unidadesSalidas: number;
  facturacionEntradas: {
    paletsCobrados: number;
    paletsImporte: number;
    bultosCobrados: number;
    bultosImporte: number;
    unidadesCobradas: number;
    unidadesImporte: number;
  };
  facturacionSalidas: {
    paletsCobrados: number;
    paletsImporte: number;
  };
}

export interface DetalleAlmacenaje {
  referencia: string;
  descripcion: string;
  palets: number;
  diasAlmacenaje: number;
  costoTotal: number;
  fechaEntrada: Date;
  fechaSalida?: Date;
}

export interface DetalleMovimiento {
  referencia: string;
  descripcion: string;
  tipo: 'palet' | 'bulto' | 'unidad';
  cantidad: number;
  precioUnitario: number;
  costoTotal: number;
  fechaMovimiento: Date;
}

@Injectable({
  providedIn: 'root',
})
export class FacturacionService {
  private apiUrlEntradas = environment.apiEntradas;
  private apiUrlSalidas = environment.apiSalidas;

  // Tarifas
  readonly TARIFA_PALET_MES = 5.4;
  readonly TARIFA_MOVIMIENTO_PALET = 2.4;
  readonly TARIFA_MOVIMIENTO_BULTO = 0.45;
  readonly TARIFA_MOVIMIENTO_UNIDAD = 0.25;

  constructor(private http: HttpClient) {}

  /**
   * Calcula la facturación para un período específico
   */
  calcularFacturacion(
    fechaInicio: string,
    fechaFin: string
  ): Observable<FacturacionCalculada> {
    // Ajustar fechas para que siempre sean del 1 al último día del mes
    const fechaInicioAjustada = this.ajustarFechaInicioMes(fechaInicio);
    const fechaFinAjustada = this.ajustarFechaFinMes(fechaFin);

    const entradas$ = this.http.get<any[]>(`${this.apiUrlEntradas}/filtrar`, {
      params: {
        fechaInicio: fechaInicioAjustada,
        fechaFin: fechaFinAjustada,
        tipoBusqueda: 'fecha',
      },
    });

    const salidas$ = this.http.get<any[]>(`${this.apiUrlSalidas}/filtrar`, {
      params: {
        fechaInicio: fechaInicioAjustada,
        fechaFin: fechaFinAjustada,
        tipoBusqueda: 'fecha',
      },
    });

    const entradasAnteriores$ = this.http.get<any[]>(
      `${this.apiUrlEntradas}/filtrar`,
      {
        params: {
          fechaInicio: '2020-01-01',
          fechaFin: this.restarUnDia(fechaInicioAjustada),
          tipoBusqueda: 'fecha',
        },
      }
    );

    const salidasAnteriores$ = this.http.get<any[]>(
      `${this.apiUrlSalidas}/filtrar`,
      {
        params: {
          fechaInicio: '2020-01-01',
          fechaFin: this.restarUnDia(fechaInicioAjustada),
          tipoBusqueda: 'fecha',
        },
      }
    );

    return forkJoin([
      entradas$,
      salidas$,
      entradasAnteriores$,
      salidasAnteriores$,
    ]).pipe(
      map(([entradas, salidas, entradasAnteriores, salidasAnteriores]) => {
        const detallesMovimientos = this.calcularMovimientos(entradas);
        const detallesAlmacenaje = this.calcularAlmacenajeCompleto(
          entradasAnteriores,
          salidasAnteriores,
          entradas,
          salidas,
          fechaInicioAjustada,
          fechaFinAjustada
        );

        // NUEVO: Calcular resumen de movimientos
        const resumenMovimientos = this.calcularResumenMovimientos(
          entradasAnteriores,
          salidasAnteriores,
          entradas,
          salidas,
          fechaInicioAjustada
        );

        const totalMovimientos = detallesMovimientos.reduce(
          (sum, d) => sum + d.costoTotal,
          0
        );
        const totalAlmacenaje = detallesAlmacenaje.reduce(
          (sum, d) => sum + d.costoTotal,
          0
        );

        return {
          totalAlmacenaje,
          totalMovimientos,
          totalGeneral: totalAlmacenaje + totalMovimientos,
          detallesAlmacenaje,
          detallesMovimientos,
          resumenMovimientos,
        };
      })
    );
  }

  /**
 * ACTUALIZADO: Calcula el resumen incluyendo facturación de entradas y salidas
 */
private calcularResumenMovimientos(
  entradasAnteriores: any[],
  salidasAnteriores: any[],
  entradasDelMes: any[],
  salidasDelMes: any[],
  fechaInicio: string
): ResumenMovimientos {
  const fechaInicioDate = new Date(fechaInicio);
  
  // Calcular stock inicial de palets
  let stockInicialPalets = 0;
  
  entradasAnteriores.forEach(entrada => {
    if (entrada.estado && entrada.productos) {
      entrada.productos.forEach((producto: any) => {
        if (producto.palets && producto.palets > 0) {
          stockInicialPalets += producto.palets;
        }
      });
    }
  });
  
  salidasAnteriores.forEach(salida => {
    if (salida.estado && salida.productos) {
      salida.productos.forEach((producto: any) => {
        if (producto.palets && producto.palets > 0) {
          stockInicialPalets -= producto.palets;
        }
      });
    }
  });
  
  // Calcular movimientos del mes - ENTRADAS
  let paletsEntrados = 0;
  let bultosEntrados = 0;
  let unidadesEntradas = 0;
  
  // Variables para facturación de ENTRADAS
  let paletsEntradaCobrados = 0;
  let bultosEntradaCobrados = 0;
  let unidadesEntradaCobradas = 0;
  
  entradasDelMes.forEach(entrada => {
    if (entrada.estado && entrada.productos) {
      entrada.productos.forEach((producto: any) => {
        // Contar movimientos totales
        if (producto.palets && producto.palets > 0) {
          paletsEntrados += producto.palets;
        }
        if (producto.bultos && producto.bultos > 0) {
          bultosEntrados += producto.bultos;
        }
        if (producto.unidades && producto.unidades > 0) {
          unidadesEntradas += producto.unidades;
        }
        
        // Determinar qué se cobra en ENTRADAS según jerarquía
        if (producto.palets && producto.palets > 0) {
          // Se cobran palets (no bultos ni unidades)
          paletsEntradaCobrados += producto.palets;
        } else if (producto.bultos && producto.bultos > 0) {
          // Se cobran bultos (no unidades)
          bultosEntradaCobrados += producto.bultos;
        } else if (producto.unidades && producto.unidades > 0) {
          // Se cobran unidades
          unidadesEntradaCobradas += producto.unidades;
        }
      });
    }
  });
  
  // Calcular movimientos del mes - SALIDAS
  let paletsSalidos = 0;
  let bultosSalidos = 0;
  let unidadesSalidas = 0;
  
  // Variables para facturación de SALIDAS (solo palets)
  let paletsSalidaCobrados = 0;
  
  salidasDelMes.forEach(salida => {
    if (salida.estado && salida.productos) {
      salida.productos.forEach((producto: any) => {
        // Contar movimientos totales
        if (producto.palets && producto.palets > 0) {
          paletsSalidos += producto.palets;
          // En salidas SOLO se cobran palets
          paletsSalidaCobrados += producto.palets;
        }
        if (producto.bultos && producto.bultos > 0) {
          bultosSalidos += producto.bultos;
          // No se cobran bultos en salidas
        }
        if (producto.unidades && producto.unidades > 0) {
          unidadesSalidas += producto.unidades;
          // No se cobran unidades en salidas
        }
      });
    }
  });
  
  return {
    stockInicialPalets: Math.max(0, stockInicialPalets),
    paletsEntrados,
    paletsSalidos,
    bultosEntrados,
    bultosSalidos,
    unidadesEntradas,
    unidadesSalidas,
    facturacionEntradas: {
      paletsCobrados: paletsEntradaCobrados,
      paletsImporte: paletsEntradaCobrados * this.TARIFA_MOVIMIENTO_PALET,
      bultosCobrados: bultosEntradaCobrados,
      bultosImporte: bultosEntradaCobrados * this.TARIFA_MOVIMIENTO_BULTO,
      unidadesCobradas: unidadesEntradaCobradas,
      unidadesImporte: unidadesEntradaCobradas * this.TARIFA_MOVIMIENTO_UNIDAD
    },
    facturacionSalidas: {
      paletsCobrados: paletsSalidaCobrados,
      paletsImporte: paletsSalidaCobrados * this.TARIFA_MOVIMIENTO_PALET
    }
  };
}

  /**
   * Ajusta la fecha para que sea el primer día del mes
   */
  private ajustarFechaInicioMes(fecha: string): string {
    const date = new Date(fecha);
    const primerDia = new Date(date.getFullYear(), date.getMonth(), 2);
    return primerDia.toISOString().split('T')[0];
  }

  /**
   * Ajusta la fecha para que sea el último día del mes
   */
  private ajustarFechaFinMes(fecha: string): string {
    const date = new Date(fecha);
    const ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return ultimoDia.toISOString().split('T')[0];
  }

  /**
   * Resta un día a una fecha
   */
  private restarUnDia(fecha: string): string {
    const date = new Date(fecha);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }

  /**
   * Calcula el almacenaje completo considerando lo que ya había + lo que entra - lo que sale
   */
  private calcularAlmacenajeCompleto(
    entradasAnteriores: any[],
    salidasAnteriores: any[],
    entradasDelMes: any[],
    salidasDelMes: any[],
    fechaInicio: string,
    fechaFin: string
  ): DetalleAlmacenaje[] {
    const detalles: DetalleAlmacenaje[] = [];
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);
    const diasEnElMes = this.getDiasEnMes(fechaInicioDate);

    // Mapa para trackear todos los palets por referencia/descripción
    const inventarioPalets = new Map<
      string,
      {
        palets: number;
        fechaUltimaEntrada: Date;
        referencia: string;
        descripcion: string;
        movimientos: Array<{
          fecha: Date;
          cantidad: number;
          tipo: 'entrada' | 'salida';
        }>;
      }
    >();

    // 1. Procesar todas las entradas ANTERIORES al mes
    entradasAnteriores.forEach((entrada) => {
      if (entrada.estado && entrada.productos && entrada.fechaRecepcion) {
        const fechaEntrada = new Date(entrada.fechaRecepcion);

        entrada.productos.forEach((producto: any) => {
          if (producto.palets && producto.palets > 0) {
            const key = `${producto.ref}-${producto.description}`;

            if (inventarioPalets.has(key)) {
              const item = inventarioPalets.get(key)!;
              item.palets += producto.palets;
              item.fechaUltimaEntrada =
                fechaEntrada > item.fechaUltimaEntrada
                  ? fechaEntrada
                  : item.fechaUltimaEntrada;
              item.movimientos.push({
                fecha: fechaEntrada,
                cantidad: producto.palets,
                tipo: 'entrada',
              });
            } else {
              inventarioPalets.set(key, {
                palets: producto.palets,
                fechaUltimaEntrada: fechaEntrada,
                referencia: producto.ref || '',
                descripcion: producto.description || '',
                movimientos: [
                  {
                    fecha: fechaEntrada,
                    cantidad: producto.palets,
                    tipo: 'entrada',
                  },
                ],
              });
            }
          }
        });
      }
    });

    // 1.1. Procesar todas las salidas ANTERIORES al mes
    salidasAnteriores.forEach((salida) => {
      if (salida.estado && salida.productos && salida.fechaEnvio) {
        const fechaSalida = new Date(salida.fechaEnvio);

        salida.productos.forEach((producto: any) => {
          if (producto.palets && producto.palets > 0) {
            const key = `${producto.ref}-${producto.description}`;

            if (inventarioPalets.has(key)) {
              const item = inventarioPalets.get(key)!;
              item.palets -= producto.palets; // ✅ Restar palets que salieron
              item.movimientos.push({
                fecha: fechaSalida,
                cantidad: -producto.palets,
                tipo: 'salida',
              });
            } else {
              // Si no existía el producto, crear entrada negativa
              inventarioPalets.set(key, {
                palets: -producto.palets,
                fechaUltimaEntrada: fechaSalida,
                referencia: producto.ref || '',
                descripcion: producto.description || '',
                movimientos: [
                  {
                    fecha: fechaSalida,
                    cantidad: -producto.palets,
                    tipo: 'salida',
                  },
                ],
              });
            }
          }
        });
      }
    });

    // 2. Procesar entradas DEL MES
    entradasDelMes.forEach((entrada) => {
      if (entrada.estado && entrada.productos && entrada.fechaRecepcion) {
        const fechaEntrada = new Date(entrada.fechaRecepcion);

        entrada.productos.forEach((producto: any) => {
          if (producto.palets && producto.palets > 0) {
            const key = `${producto.ref}-${producto.description}`;

            if (inventarioPalets.has(key)) {
              const item = inventarioPalets.get(key)!;
              item.palets += producto.palets;
              item.fechaUltimaEntrada =
                fechaEntrada > item.fechaUltimaEntrada
                  ? fechaEntrada
                  : item.fechaUltimaEntrada;
              item.movimientos.push({
                fecha: fechaEntrada,
                cantidad: producto.palets,
                tipo: 'entrada',
              });
            } else {
              inventarioPalets.set(key, {
                palets: producto.palets,
                fechaUltimaEntrada: fechaEntrada,
                referencia: producto.ref || '',
                descripcion: producto.description || '',
                movimientos: [
                  {
                    fecha: fechaEntrada,
                    cantidad: producto.palets,
                    tipo: 'entrada',
                  },
                ],
              });
            }
          }
        });
      }
    });

    // 3. Procesar salidas DEL MES
    salidasDelMes.forEach((salida) => {
      if (salida.estado && salida.productos && salida.fechaEnvio) {
        const fechaSalida = new Date(salida.fechaEnvio);

        salida.productos.forEach((producto: any) => {
          if (producto.palets && producto.palets > 0) {
            const key = `${producto.ref}-${producto.description}`;

            if (inventarioPalets.has(key)) {
              const item = inventarioPalets.get(key)!;
              item.movimientos.push({
                fecha: fechaSalida,
                cantidad: -producto.palets,
                tipo: 'salida',
              });
            }
          }
        });
      }
    });

    // 4. Calcular facturación para cada referencia/descripción
    inventarioPalets.forEach((item, key) => {
      let costoTotal = 0;
      let diasFacturados = 0;

      // Calcular cuántos palets había al inicio del mes
      let paletsAlInicio = 0;
      item.movimientos.forEach((mov) => {
        if (mov.fecha < fechaInicioDate) {
          paletsAlInicio += mov.cantidad;
        }
      });

      // Si había palets al inicio del mes, se facturan completos
      if (paletsAlInicio > 0) {
        const costoCompleto = paletsAlInicio * this.TARIFA_PALET_MES;
        costoTotal += costoCompleto;
        diasFacturados = diasEnElMes;

        detalles.push({
          referencia: item.referencia,
          descripcion: item.descripcion,
          palets: paletsAlInicio,
          diasAlmacenaje: diasEnElMes,
          costoTotal: costoCompleto,
          fechaEntrada: item.fechaUltimaEntrada,
          fechaSalida: undefined,
        });
      }

      // Procesar movimientos durante el mes
      const movimientosDelMes = item.movimientos
        .filter(
          (mov) => mov.fecha >= fechaInicioDate && mov.fecha <= fechaFinDate
        )
        .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

      movimientosDelMes.forEach((mov) => {
        if (mov.tipo === 'entrada') {
          // Palets que entran: se facturan proporcionalmente desde su entrada
          const diasDesdeEntrada = this.calcularDiasDesdeEntrada(
            mov.fecha,
            fechaFinDate
          );
          const costoEntrada =
            (mov.cantidad * this.TARIFA_PALET_MES * diasDesdeEntrada) /
            diasEnElMes;
          costoTotal += costoEntrada;

          detalles.push({
            referencia: item.referencia,
            descripcion: item.descripcion,
            palets: mov.cantidad,
            diasAlmacenaje: diasDesdeEntrada,
            costoTotal: costoEntrada,
            fechaEntrada: mov.fecha,
            fechaSalida: undefined,
          });
        } else if (mov.tipo === 'salida') {
          // Palets que salen: se descuenta proporcionalmente desde su salida
          const diasHastaSalida = this.calcularDiasHastaSalida(
            fechaInicioDate,
            mov.fecha
          );
          const diasNoFacturados = diasEnElMes - diasHastaSalida;
          const descuento =
            (Math.abs(mov.cantidad) *
              this.TARIFA_PALET_MES *
              diasNoFacturados) /
            diasEnElMes;
          costoTotal -= descuento;

          detalles.push({
            referencia: item.referencia,
            descripcion: item.descripcion,
            palets: mov.cantidad, // Negativo para mostrar que es salida
            diasAlmacenaje: -diasNoFacturados, // Negativo para mostrar descuento
            costoTotal: -descuento, // Negativo para mostrar descuento
            fechaEntrada: item.fechaUltimaEntrada,
            fechaSalida: mov.fecha,
          });
        }
      });
    });

    return detalles;
  }

  /**
   * Calcula días desde la entrada hasta el fin del mes
   */
  private calcularDiasDesdeEntrada(
    fechaEntrada: Date,
    fechaFinMes: Date
  ): number {
    const diferenciaTiempo = fechaFinMes.getTime() - fechaEntrada.getTime();
    return Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)) + 1;
  }

  /**
   * Calcula días desde el inicio del mes hasta la salida
   */
  private calcularDiasHastaSalida(
    fechaInicioMes: Date,
    fechaSalida: Date
  ): number {
    const diferenciaTiempo = fechaSalida.getTime() - fechaInicioMes.getTime();
    return Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)) + 1;
  }

  /**
   * Calcula los costos de movimientos de entrada
   */
  private calcularMovimientos(entradas: any[]): DetalleMovimiento[] {
    const detalles: DetalleMovimiento[] = [];

    entradas.forEach((entrada) => {
      if (entrada.estado && entrada.productos) {
        entrada.productos.forEach((producto: any) => {
          const detalle = this.calcularMovimientoProducto(
            producto,
            entrada.fechaRecepcion
          );
          if (detalle) {
            detalles.push(detalle);
          }
        });
      }
    });

    return detalles;
  }

  /**
   * Calcula el movimiento de un producto siguiendo la jerarquía palets > bultos > unidades
   */
  private calcularMovimientoProducto(
    producto: any,
    fechaMovimiento: string
  ): DetalleMovimiento | null {
    if (!producto.palets && !producto.bultos && !producto.unidades) {
      return null;
    }

    // Jerarquía: palets > bultos > unidades
    if (producto.palets && producto.palets > 0) {
      return {
        referencia: producto.ref || '',
        descripcion: producto.description || '',
        tipo: 'palet',
        cantidad: producto.palets,
        precioUnitario: this.TARIFA_MOVIMIENTO_PALET,
        costoTotal: producto.palets * this.TARIFA_MOVIMIENTO_PALET,
        fechaMovimiento: new Date(fechaMovimiento),
      };
    } else if (producto.bultos && producto.bultos > 0) {
      return {
        referencia: producto.ref || '',
        descripcion: producto.description || '',
        tipo: 'bulto',
        cantidad: producto.bultos,
        precioUnitario: this.TARIFA_MOVIMIENTO_BULTO,
        costoTotal: producto.bultos * this.TARIFA_MOVIMIENTO_BULTO,
        fechaMovimiento: new Date(fechaMovimiento),
      };
    } else if (producto.unidades && producto.unidades > 0) {
      return {
        referencia: producto.ref || '',
        descripcion: producto.description || '',
        tipo: 'unidad',
        cantidad: producto.unidades,
        precioUnitario: this.TARIFA_MOVIMIENTO_UNIDAD,
        costoTotal: producto.unidades * this.TARIFA_MOVIMIENTO_UNIDAD,
        fechaMovimiento: new Date(fechaMovimiento),
      };
    }

    return null;
  }

  /**
   * Calcula los costos de almacenaje (método legacy - no se usa con la nueva lógica)
   */
  private calcularAlmacenajeLegacy(
    entradas: any[],
    salidas: any[],
    fechaInicio: string,
    fechaFin: string
  ): DetalleAlmacenaje[] {
    const detalles: DetalleAlmacenaje[] = [];
    const paletsAlmacenaje = new Map<
      string,
      {
        palets: number;
        fechaEntrada: Date;
        fechaSalida?: Date;
        referencia: string;
        descripcion: string;
      }
    >();

    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);

    // Registrar entradas de palets
    entradas.forEach((entrada) => {
      if (entrada.estado && entrada.productos && entrada.fechaRecepcion) {
        const fechaEntrada = new Date(entrada.fechaRecepcion);

        entrada.productos.forEach((producto: any) => {
          if (producto.palets && producto.palets > 0) {
            const key = `${producto.ref}-${
              producto.description
            }-${fechaEntrada.getTime()}`;
            paletsAlmacenaje.set(key, {
              palets: producto.palets,
              fechaEntrada,
              referencia: producto.ref || '',
              descripcion: producto.description || '',
            });
          }
        });
      }
    });

    // Registrar salidas de palets
    salidas.forEach((salida) => {
      if (salida.estado && salida.productos && salida.fechaEnvio) {
        const fechaSalida = new Date(salida.fechaEnvio);

        salida.productos.forEach((producto: any) => {
          if (producto.palets && producto.palets > 0) {
            // Buscar palets correspondientes
            paletsAlmacenaje.forEach((value, key) => {
              if (
                value.referencia === producto.ref &&
                value.descripcion === producto.description &&
                !value.fechaSalida &&
                value.fechaEntrada <= fechaSalida
              ) {
                value.fechaSalida = fechaSalida;
              }
            });
          }
        });
      }
    });

    // Calcular costos de almacenaje
    paletsAlmacenaje.forEach((palet) => {
      const diasAlmacenaje = this.calcularDiasAlmacenaje(
        palet.fechaEntrada,
        palet.fechaSalida,
        fechaInicioDate,
        fechaFinDate
      );

      if (diasAlmacenaje > 0) {
        const diasEnElMes = this.getDiasEnMes(fechaInicioDate);
        const costoProporcional =
          ((this.TARIFA_PALET_MES * diasAlmacenaje) / diasEnElMes) *
          palet.palets;

        detalles.push({
          referencia: palet.referencia,
          descripcion: palet.descripcion,
          palets: palet.palets,
          diasAlmacenaje,
          costoTotal: costoProporcional,
          fechaEntrada: palet.fechaEntrada,
          fechaSalida: palet.fechaSalida,
        });
      }
    });

    return detalles;
  }

  /**
   * Calcula los días de almacenaje dentro del período de facturación
   */
  private calcularDiasAlmacenaje(
    fechaEntrada: Date,
    fechaSalida: Date | undefined,
    fechaInicioMes: Date,
    fechaFinMes: Date
  ): number {
    // El inicio del almacenaje es la fecha más tardía entre la entrada y el inicio del mes
    const inicioAlmacenaje =
      fechaEntrada > fechaInicioMes ? fechaEntrada : fechaInicioMes;

    // El fin del almacenaje es la fecha más temprana entre la salida y el fin del mes
    const finAlmacenaje =
      fechaSalida && fechaSalida < fechaFinMes ? fechaSalida : fechaFinMes;

    // Si el inicio es posterior al fin, no hay días de almacenaje
    if (inicioAlmacenaje > finAlmacenaje) {
      return 0;
    }

    // Calcular diferencia en días
    const diferenciaTiempo =
      finAlmacenaje.getTime() - inicioAlmacenaje.getTime();
    const dias = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)) + 1; // +1 para incluir ambos días

    return Math.max(0, dias);
  }

  /**
   * Obtiene el número de días en un mes
   */
  private getDiasEnMes(fecha: Date): number {
    return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  }

  /**
   * Exporta la facturación a CSV
   */
  exportarCSV(facturacion: FacturacionCalculada, periodo: string): void {
    const headers = [
      'Tipo',
      'Referencia',
      'Descripción',
      'Concepto',
      'Cantidad',
      'Precio Unitario',
      'Total',
      'Días Almacenaje',
      'Fecha',
    ];

    const rows: string[][] = [];

    // Agregar movimientos
    facturacion.detallesMovimientos.forEach((movimiento) => {
      rows.push([
        'Movimiento',
        movimiento.referencia,
        movimiento.descripcion,
        `Movimiento por ${movimiento.tipo}`,
        movimiento.cantidad.toString(),
        movimiento.precioUnitario.toFixed(2),
        movimiento.costoTotal.toFixed(2),
        '',
        movimiento.fechaMovimiento.toLocaleDateString(),
      ]);
    });

    // Agregar almacenaje
    facturacion.detallesAlmacenaje.forEach((almacenaje) => {
      rows.push([
        'Almacenaje',
        almacenaje.referencia,
        almacenaje.descripcion,
        'Almacenaje de palets',
        almacenaje.palets.toString(),
        this.TARIFA_PALET_MES.toFixed(2),
        almacenaje.costoTotal.toFixed(2),
        almacenaje.diasAlmacenaje.toString(),
        almacenaje.fechaEntrada.toLocaleDateString(),
      ]);
    });

    // Agregar totales
    rows.push([
      '',
      '',
      '',
      '',
      '',
      'TOTAL MOVIMIENTOS:',
      facturacion.totalMovimientos.toFixed(2),
      '',
      '',
    ]);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      'TOTAL ALMACENAJE:',
      facturacion.totalAlmacenaje.toFixed(2),
      '',
      '',
    ]);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      'TOTAL GENERAL:',
      facturacion.totalGeneral.toFixed(2),
      '',
      '',
    ]);

    // Crear CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `facturacion_${periodo}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Exporta la facturación a PDF (resumen)
   */
  exportarPDF(facturacion: FacturacionCalculada, periodo: string): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Título principal
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURACIÓN MENSUAL', pageWidth / 2, yPosition, {
      align: 'center',
    });

    yPosition += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Período: ${this.formatearPeriodo(periodo)}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );

    yPosition += 20;

    // Resumen de totales
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DE FACTURACIÓN', 20, yPosition);

    yPosition += 15;

    const resumenData = [
      ['Concepto', 'Importe'],
      ['Total Almacenaje', `${facturacion.totalAlmacenaje.toFixed(2)} €`],
      ['Total Movimientos', `${facturacion.totalMovimientos.toFixed(2)} €`],
      ['', ''], // Línea separadora
      ['TOTAL GENERAL', `${facturacion.totalGeneral.toFixed(2)} €`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [resumenData[0]],
      body: resumenData.slice(1),
      theme: 'grid',
      styles: { fontSize: 12 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: (data) => {
        if (data.row.index === 3 && data.column.index === 0) {
          // Línea separadora
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.text = [];
        }
        if (data.row.index === 4) {
          // Fila del total
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [52, 152, 219];
          data.cell.styles.textColor = 255;
        }
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Detalle de almacenaje
    if (facturacion.detallesAlmacenaje.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE ALMACENAJE', 20, yPosition);

      yPosition += 10;

      const almacenajeData = facturacion.detallesAlmacenaje.map((detalle) => [
        detalle.referencia,
        detalle.descripcion,
        detalle.palets.toString(),
        detalle.diasAlmacenaje.toString(),
        `${detalle.costoTotal.toFixed(2)} €`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Referencia', 'Descripción', 'Palets', 'Días', 'Total']],
        body: almacenajeData,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [155, 89, 182], textColor: 255 },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'right' },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Verificar si necesitamos nueva página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Detalle de movimientos
    if (facturacion.detallesMovimientos.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE MOVIMIENTOS', 20, yPosition);

      yPosition += 10;

      const movimientosData = facturacion.detallesMovimientos.map((detalle) => [
        detalle.referencia,
        detalle.descripcion,
        detalle.tipo.toUpperCase(),
        detalle.cantidad.toString(),
        `${detalle.precioUnitario.toFixed(2)} €`,
        `${detalle.costoTotal.toFixed(2)} €`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [
          [
            'Referencia',
            'Descripción',
            'Tipo',
            'Cantidad',
            'P. Unit.',
            'Total',
          ],
        ],
        body: movimientosData,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [231, 76, 60], textColor: 255 },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'right' },
          5: { halign: 'right' },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Información de tarifas al final
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TARIFAS APLICADAS', 20, yPosition);

    yPosition += 10;

    const tarifasData = [
      ['Concepto', 'Tarifa'],
      ['Almacenaje por palet/mes', `${this.TARIFA_PALET_MES.toFixed(2)} €`],
      ['Movimiento por palet', `${this.TARIFA_MOVIMIENTO_PALET.toFixed(2)} €`],
      ['Movimiento por bulto', `${this.TARIFA_MOVIMIENTO_BULTO.toFixed(2)} €`],
      [
        'Movimiento por unidad',
        `${this.TARIFA_MOVIMIENTO_UNIDAD.toFixed(2)} €`,
      ],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [tarifasData[0]],
      body: tarifasData.slice(1),
      theme: 'plain',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [149, 165, 166], textColor: 255 },
      columnStyles: {
        1: { halign: 'right' },
      },
    });

    // Pie de página
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Documento generado el ${new Date().toLocaleDateString('es-ES')}`,
      20,
      finalY
    );

    // Descargar PDF
    doc.save(`facturacion_resumen_${periodo}.pdf`);
  }

  /**
   * Exporta los detalles a Excel
   */
  exportarExcel(facturacion: FacturacionCalculada, periodo: string): void {
    const workbook = XLSX.utils.book_new();

    // Hoja de resumen
    const resumenData = [
      ['FACTURACIÓN MENSUAL'],
      [`Período: ${this.formatearPeriodo(periodo)}`],
      [''],
      ['Concepto', 'Importe'],
      ['Total Almacenaje', facturacion.totalAlmacenaje],
      ['Total Movimientos', facturacion.totalMovimientos],
      ['TOTAL GENERAL', facturacion.totalGeneral],
    ];

    const resumenWS = XLSX.utils.aoa_to_sheet(resumenData);

    // Aplicar estilos básicos al resumen
    resumenWS['!cols'] = [{ width: 20 }, { width: 15 }];

    XLSX.utils.book_append_sheet(workbook, resumenWS, 'Resumen');

    // Hoja de detalle de almacenaje
    if (facturacion.detallesAlmacenaje.length > 0) {
      const almacenajeHeaders = [
        'Referencia',
        'Descripción',
        'Palets',
        'Días Almacenaje',
        'Costo Total',
        'Fecha Entrada',
        'Fecha Salida',
      ];
      const almacenajeData = facturacion.detallesAlmacenaje.map((detalle) => [
        detalle.referencia,
        detalle.descripcion,
        detalle.palets,
        detalle.diasAlmacenaje,
        detalle.costoTotal,
        detalle.fechaEntrada.toLocaleDateString('es-ES'),
        detalle.fechaSalida
          ? detalle.fechaSalida.toLocaleDateString('es-ES')
          : '',
      ]);

      const almacenajeWS = XLSX.utils.aoa_to_sheet([
        almacenajeHeaders,
        ...almacenajeData,
      ]);
      almacenajeWS['!cols'] = [
        { width: 15 },
        { width: 30 },
        { width: 10 },
        { width: 15 },
        { width: 12 },
        { width: 15 },
        { width: 15 },
      ];

      XLSX.utils.book_append_sheet(workbook, almacenajeWS, 'Almacenaje');
    }

    // Hoja de detalle de movimientos
    if (facturacion.detallesMovimientos.length > 0) {
      const movimientosHeaders = [
        'Referencia',
        'Descripción',
        'Tipo',
        'Cantidad',
        'Precio Unitario',
        'Costo Total',
        'Fecha Movimiento',
      ];
      const movimientosData = facturacion.detallesMovimientos.map((detalle) => [
        detalle.referencia,
        detalle.descripcion,
        detalle.tipo,
        detalle.cantidad,
        detalle.precioUnitario,
        detalle.costoTotal,
        detalle.fechaMovimiento.toLocaleDateString('es-ES'),
      ]);

      const movimientosWS = XLSX.utils.aoa_to_sheet([
        movimientosHeaders,
        ...movimientosData,
      ]);
      movimientosWS['!cols'] = [
        { width: 15 },
        { width: 30 },
        { width: 12 },
        { width: 10 },
        { width: 15 },
        { width: 12 },
        { width: 15 },
      ];

      XLSX.utils.book_append_sheet(workbook, movimientosWS, 'Movimientos');
    }

    // Hoja de tarifas
    const tarifasData = [
      ['TARIFAS APLICADAS'],
      [''],
      ['Concepto', 'Tarifa (€)'],
      ['Almacenaje por palet/mes', this.TARIFA_PALET_MES],
      ['Movimiento por palet', this.TARIFA_MOVIMIENTO_PALET],
      ['Movimiento por bulto', this.TARIFA_MOVIMIENTO_BULTO],
      ['Movimiento por unidad', this.TARIFA_MOVIMIENTO_UNIDAD],
    ];

    const tarifasWS = XLSX.utils.aoa_to_sheet(tarifasData);
    tarifasWS['!cols'] = [{ width: 25 }, { width: 15 }];

    XLSX.utils.book_append_sheet(workbook, tarifasWS, 'Tarifas');

    // Descargar archivo Excel
    XLSX.writeFile(workbook, `facturacion_detalle_${periodo}.xlsx`);
  }

  /**
   * Formatea el período para mostrar en los documentos
   */
  private formatearPeriodo(periodo: string): string {
    const fecha = new Date(periodo + '-01');
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
  }
}
