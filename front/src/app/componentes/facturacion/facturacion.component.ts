import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EntradaServices } from '../../services/entrada.service';
import { SalidaServices } from '../../services/salida.service';
import {FacturacionService, FacturacionCalculada, ResumenMovimientos} from '../../services/facturacion.service';
import { Entrada } from '../../models/entrada.model';
import { Salida } from '../../models/salida.model';
import { ProductoEntrada } from '../../models/productoEntrada.model';
import { ProductoSalida } from '../../models/productoSalida.model';
import { Component, OnInit } from '@angular/core';

interface DetalleFacturacion {
  tipo: 'almacenaje' | 'movimiento';
  concepto: string;
  cantidad: number;
  precio: number;
  total: number;
  referencia?: string;
  descripcion?: string;
  diasAlmacenaje?: number;
  fechaEntrada?: Date;
  fechaSalida?: Date;
}

interface ResumenFacturacion {
  totalAlmacenaje: number;
  totalMovimientos: number;
  totalGeneral: number;
  detalles: DetalleFacturacion[];
  resumenMovimientos: ResumenMovimientos;
}

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.css'],
})
export class FacturacionComponent implements OnInit {
  facturacionForm!: FormGroup;
  mostrarResultados = false;
  cargando = false;
  resumenFacturacion: ResumenFacturacion | null = null;

  // Exponer Math para usar en template
  Math = Math;

  // Tarifas
  readonly TARIFA_PALET_MES = 5.4;
  readonly TARIFA_MOVIMIENTO_PALET = 2.4;
  readonly TARIFA_MOVIMIENTO_BULTO = 0.45;
  readonly TARIFA_MOVIMIENTO_UNIDAD = 0.25;

  // Columnas para la tabla de detalles
  displayedColumns: string[] = [
    'tipo',
    'concepto',
    'cantidad',
    'precio',
    'total',
  ];

  constructor(
    private fb: FormBuilder,
    private entradaService: EntradaServices,
    private salidaService: SalidaServices,
    private facturacionService: FacturacionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    this.facturacionForm = this.fb.group({
      mesSeleccionado: [
        this.formatDateForInput(firstDayOfMonth),
        Validators.required,
      ],
      fechaInicio: [
        this.formatDateForInput(firstDayOfMonth),
        Validators.required,
      ],
      fechaFin: [this.formatDateForInput(lastDayOfMonth), Validators.required],
    });

    // Escuchar cambios en el mes seleccionado
    this.facturacionForm
      .get('mesSeleccionado')
      ?.valueChanges.subscribe((value) => {
        if (value) {
          this.actualizarRangoFechas(value);
        }
      });
  }

  getMovimientoNeto(tipo: 'bultos' | 'unidades'): number {
    if (!this.resumenFacturacion) {
      return 0;
    }

    if (tipo === 'bultos') {
      return (
        this.resumenFacturacion.resumenMovimientos.bultosEntrados -
        this.resumenFacturacion.resumenMovimientos.bultosSalidos
      );
    } else {
      return (
        this.resumenFacturacion.resumenMovimientos.unidadesEntradas -
        this.resumenFacturacion.resumenMovimientos.unidadesSalidas
      );
    }
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private actualizarRangoFechas(mesSeleccionado: string) {
    const fecha = new Date(mesSeleccionado);
    const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 2);
    const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1);

    this.facturacionForm.patchValue({
      fechaInicio: this.formatDateForInput(primerDia),
      fechaFin: this.formatDateForInput(ultimoDia),
    });
  }

  calcularFacturacion() {
    if (this.facturacionForm.invalid) {
      this.snackBar.open(
        'Por favor, complete todos los campos requeridos',
        'Cerrar',
        {
          duration: 3000,
          panelClass: 'error',
        }
      );
      return;
    }

    this.cargando = true;
    this.mostrarResultados = false;

    const fechaInicio = this.facturacionForm.get('fechaInicio')?.value;
    const fechaFin = this.facturacionForm.get('fechaFin')?.value;

    this.facturacionService
      .calcularFacturacion(fechaInicio, fechaFin)
      .subscribe({
        next: (facturacion) => {
          this.resumenFacturacion = this.convertirFacturacion(facturacion);
          this.mostrarResultados = true;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al calcular facturación:', error);
          this.snackBar.open('Error al calcular la facturación', 'Cerrar', {
            duration: 3000,
            panelClass: 'error',
          });
          this.cargando = false;
        },
      });
  }

  private convertirFacturacion(
    facturacion: FacturacionCalculada
  ): ResumenFacturacion {
    const detalles: DetalleFacturacion[] = [];

    // Convertir movimientos
    facturacion.detallesMovimientos.forEach((mov) => {
      detalles.push({
        tipo: 'movimiento',
        concepto: `Movimiento de entrada - ${mov.tipo}s`,
        cantidad: mov.cantidad,
        precio: mov.precioUnitario,
        total: mov.costoTotal,
        referencia: mov.referencia,
        descripcion: mov.descripcion,
      });
    });

    // Convertir almacenaje
    facturacion.detallesAlmacenaje.forEach((alm) => {
      detalles.push({
        tipo: 'almacenaje',
        concepto: 'Almacenaje de palets',
        cantidad: alm.palets,
        precio: this.TARIFA_PALET_MES,
        total: alm.costoTotal,
        referencia: alm.referencia,
        descripcion: alm.descripcion,
        diasAlmacenaje: alm.diasAlmacenaje,
        fechaEntrada: alm.fechaEntrada,
        fechaSalida: alm.fechaSalida,
      });
    });

    return {
      totalAlmacenaje: facturacion.totalAlmacenaje,
      totalMovimientos: facturacion.totalMovimientos,
      totalGeneral: facturacion.totalGeneral,
      detalles,
      resumenMovimientos: facturacion.resumenMovimientos, // NUEVO
    };
  }

  exportarFacturacion() {
    if (!this.resumenFacturacion) {
      return;
    }

    const periodo = this.facturacionForm.get('mesSeleccionado')?.value;
    const csvContent = this.generarCSV();
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

  private generarCSV(): string {
    if (!this.resumenFacturacion) {
      return '';
    }

    const headers = [
      'Tipo',
      'Concepto',
      'Referencia',
      'Descripción',
      'Cantidad',
      'Precio',
      'Total',
      'Días Almacenaje',
    ];
    const rows = this.resumenFacturacion.detalles.map((detalle) => [
      detalle.tipo,
      detalle.concepto,
      detalle.referencia || '',
      detalle.descripcion || '',
      detalle.cantidad.toString(),
      detalle.precio.toFixed(2),
      detalle.total.toFixed(2),
      detalle.diasAlmacenaje?.toString() || '',
    ]);

    // Agregar fila de totales
    rows.push([
      '',
      '',
      '',
      '',
      '',
      'TOTAL MOVIMIENTOS:',
      this.resumenFacturacion.totalMovimientos.toFixed(2),
      '',
    ]);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      'TOTAL ALMACENAJE:',
      this.resumenFacturacion.totalAlmacenaje.toFixed(2),
      '',
    ]);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      'TOTAL GENERAL:',
      this.resumenFacturacion.totalGeneral.toFixed(2),
      '',
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  getTotalPorTipo(tipo: 'almacenaje' | 'movimiento'): number {
    if (!this.resumenFacturacion) {
      return 0;
    }
    return this.resumenFacturacion.detalles
      .filter((d) => d.tipo === tipo)
      .reduce((sum, d) => sum + d.total, 0);
  }

  exportarPDF() {
    if (!this.resumenFacturacion) {
      return;
    }

    const periodo = this.facturacionForm.get('mesSeleccionado')?.value;

    // Convertir ResumenFacturacion a FacturacionCalculada
    const facturacionCalculada: FacturacionCalculada = {
      totalAlmacenaje: this.resumenFacturacion.totalAlmacenaje,
      totalMovimientos: this.resumenFacturacion.totalMovimientos,
      totalGeneral: this.resumenFacturacion.totalGeneral,
      detallesAlmacenaje: this.resumenFacturacion.detalles
        .filter((d) => d.tipo === 'almacenaje')
        .map((d) => ({
          referencia: d.referencia || '',
          descripcion: d.descripcion || '',
          palets: d.cantidad,
          diasAlmacenaje: d.diasAlmacenaje || 0,
          costoTotal: d.total,
          fechaEntrada: d.fechaEntrada || new Date(),
          fechaSalida: d.fechaSalida,
        })),
      detallesMovimientos: this.resumenFacturacion.detalles
        .filter((d) => d.tipo === 'movimiento')
        .map((d) => ({
          referencia: d.referencia || '',
          descripcion: d.descripcion || '',
          tipo: this.extraerTipoMovimiento(d.concepto),
          cantidad: d.cantidad,
          precioUnitario: d.precio,
          costoTotal: d.total,
          fechaMovimiento: new Date(),
        })),
      resumenMovimientos: this.resumenFacturacion.resumenMovimientos,
    };

    this.facturacionService.exportarPDF(facturacionCalculada, periodo);
  }

  exportarExcel() {
    if (!this.resumenFacturacion) {
      return;
    }

    const periodo = this.facturacionForm.get('mesSeleccionado')?.value;

    // Convertir ResumenFacturacion a FacturacionCalculada (mismo código que arriba)
    const facturacionCalculada: FacturacionCalculada = {
      totalAlmacenaje: this.resumenFacturacion.totalAlmacenaje,
      totalMovimientos: this.resumenFacturacion.totalMovimientos,
      totalGeneral: this.resumenFacturacion.totalGeneral,
      detallesAlmacenaje: this.resumenFacturacion.detalles
        .filter((d) => d.tipo === 'almacenaje')
        .map((d) => ({
          referencia: d.referencia || '',
          descripcion: d.descripcion || '',
          palets: d.cantidad,
          diasAlmacenaje: d.diasAlmacenaje || 0,
          costoTotal: d.total,
          fechaEntrada: d.fechaEntrada || new Date(),
          fechaSalida: d.fechaSalida,
        })),
      detallesMovimientos: this.resumenFacturacion.detalles
        .filter((d) => d.tipo === 'movimiento')
        .map((d) => ({
          referencia: d.referencia || '',
          descripcion: d.descripcion || '',
          tipo: this.extraerTipoMovimiento(d.concepto),
          cantidad: d.cantidad,
          precioUnitario: d.precio,
          costoTotal: d.total,
          fechaMovimiento: new Date(),
        })),
      resumenMovimientos: this.resumenFacturacion.resumenMovimientos,
    };

    this.facturacionService.exportarExcel(facturacionCalculada, periodo);
  }

  private extraerTipoMovimiento(
    concepto: string
  ): 'palet' | 'bulto' | 'unidad' {
    if (concepto.includes('palet')) return 'palet';
    if (concepto.includes('bulto')) return 'bulto';
    return 'unidad';
  }

  getStockFinalPalets(): number {
    if (!this.resumenFacturacion) {
      return 0;
    }
    return (
      this.resumenFacturacion.resumenMovimientos.stockInicialPalets +
      this.resumenFacturacion.resumenMovimientos.paletsEntrados -
      this.resumenFacturacion.resumenMovimientos.paletsSalidos
    );
  }

  getTotalEntradas(): number {
    if (!this.resumenFacturacion) {
      return 0;
    }
    const facturacion =
      this.resumenFacturacion.resumenMovimientos.facturacionEntradas;
    return (
      facturacion.paletsImporte +
      facturacion.bultosImporte +
      facturacion.unidadesImporte
    );
  }

  getTotalSalidas(): number {
    if (!this.resumenFacturacion) {
      return 0;
    }
    return this.resumenFacturacion.resumenMovimientos.facturacionSalidas
      .paletsImporte;
  }

  getEstadoUnidades(): string {
    if (!this.resumenFacturacion) {
      return '';
    }

    const paletsCobrados =
      this.resumenFacturacion.resumenMovimientos.facturacionEntradas
        .paletsCobrados;
    const bultosCobrados =
      this.resumenFacturacion.resumenMovimientos.facturacionEntradas
        .bultosCobrados;

    if (paletsCobrados > 0) {
      return 'No facturadas (se cobraron palets)';
    } else if (bultosCobrados > 0) {
      return 'No facturadas (se cobraron bultos)';
    }

    return 'Sin movimientos facturables';
  }
}
