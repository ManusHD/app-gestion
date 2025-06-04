import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Entrada } from 'src/app/models/entrada.model';
import { ProductoUbicacion } from 'src/app/models/productoUbicacion.model';
import { Salida } from 'src/app/models/salida.model';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { SnackBar } from 'src/app/services/snackBar.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-exportar-excel',
  templateUrl: './exportar-excel.component.html',
  styleUrls: [
    '../../../assets/styles/modal.css',
    './exportar-excel.component.css'
  ],
})
export class ExportarExcelComponent implements OnInit, OnDestroy {
  mostrarModal: boolean = false;
  @Input() data: any[] = []
  @Input() data$?: Observable<any[]>;
  @Input() fileName: string = '';
  @Input() nombreConjuntoExportado: string = '';
  
  private dataSubscription?: Subscription;
  dataCompleta: any[] = [];

  constructor(private snackbar: SnackBar) {}

  ngOnInit() {
    if (this.data$) {
      this.dataSubscription = this.data$.subscribe(datos => {
        this.dataCompleta = datos;
      });
    } else {
      this.dataCompleta = this.data;
    }
  }
  
  ngOnDestroy() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  exportarExcel(): void {
    if (this.dataCompleta.length > 0) {
      switch (this.nombreConjuntoExportado) {
        case 'PRODUCTOS':
          this.exportarProductos();
          break;
        case 'SIN REFERENCIA':
          this.exportarProductos();
          break;
        case 'VISUALES':
          this.exportarProductos();
          break;
        case 'ENTRADAS':
          this.exportarEntradas();
          break;
        case 'SALIDAS':
          this.exportarSalidas();
          break;
        case 'UBICACIONES':
          this.exportarUbicaciones();
          break;
        default:
          this.snackbar.snackBarError(
            'No se ha podido exportar el conjunto de datos'
          );
      }
    }
  }

  exportarProductos() {
    const filteredData = this.dataCompleta.map(({ id, ...rest }) => rest);
    const workSheet = XLSX.utils.json_to_sheet(filteredData);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, 'Productos');
    XLSX.writeFile(workBook, `${this.fileName}.xlsx`);
    this.cerrarModal();
  }

  exportarEntradas() {
    // Transformar los datos
    let data: any[] = [];
    this.dataCompleta.forEach((entrada: Entrada) => {
      entrada.productos.forEach((producto) => {
        data.push({
          // Origen: entrada.origen ?? '',
          // Perfumería: entrada.perfumeria ?? '',
          // PDV: entrada.pdv ?? '',
          // Colaborador: entrada.colaborador ?? '',
          // DCS: entrada.dcs ?? '',
          // 'Fecha Recepción': entrada.fechaRecepcion ?? '',
          // Referencia: producto.ref ?? '',
          // Descripción: producto.description ?? '',
          // Unidades: producto.unidades ?? '',
          // Ubicación: producto.ubicacion ?? '',
          // Palets: producto.palets ?? '',
          // Bultos: producto.bultos ?? '',
          // Observaciones: producto.observaciones ?? '',
          'Fecha Recepción': entrada.fechaRecepcion ? new Date(entrada.fechaRecepcion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', }) : '',
          Referencia: producto.ref ?? '',
          Descripción: producto.description ?? '',
          Palets: producto.palets ?? '',
          Bultos: producto.bultos ?? '',
          Unidades: producto.unidades ?? '',
          Origen: entrada.origen ?? '',
          Perfumería: entrada.perfumeria ?? '',
          PDV: entrada.pdv ?? '',
          Colaborador: entrada.colaborador ?? '',
          DCS: entrada.dcs ?? '',
          Observaciones: producto.observaciones ?? '',
          Ubicación: producto.ubicacion ?? '',
        });
      });
    });

    // Crear hoja de trabajo
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { 'Entradas': worksheet }, SheetNames: ['Entradas'] };
    XLSX.writeFile(workbook, `${this.fileName}.xlsx`);
    this.cerrarModal();
  }

  exportarSalidas() {
    let data: any[] = [];
    this.dataCompleta.forEach((salida: Salida) => {
      salida.productos.forEach((producto) => {
        data.push({
          // Estado: salida.estado ? 'Recibida' : 'Pendiente',
          'Fecha Envío': salida.fechaEnvio ? new Date(salida.fechaEnvio).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', }) : '',
          Referencia: producto.ref ?? '',
          Descripción: producto.description ?? '',
          Palets: producto.palets ?? '',
          Bultos: producto.bultos ?? '',
          Unidades: producto.unidades ?? '',
          Destino: salida.destino ?? '',
          Perfumería: salida.perfumeria ?? '',
          PDV: salida.pdv ?? '',
          Colaborador: salida.colaborador ?? '',
          Direccion: [salida.direccion, salida.poblacion, salida.provincia, salida.cp]
            .filter(Boolean)
            .join(', ') || '',
          'AGENCIA DE TRANSPORTE': producto.formaEnvio ?? '',
          Observaciones: producto.observaciones ?? '',
          Ubicación: producto.ubicacion ?? '',
        });
      });
    });

    // Crear hoja de trabajo
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Salidas': worksheet },
      SheetNames: ['Salidas'],
    };
    XLSX.writeFile(workbook, `${this.fileName}.xlsx`);
    this.cerrarModal();
  }

  exportarUbicaciones() {
    let data: any[] = [];
    this.dataCompleta.forEach((ubicacion: Ubicacion) => {+
      ubicacion!.productos!.forEach((producto) => {
        data.push({
          Ubicación: ubicacion.nombre ?? '',
          Referencia: producto.ref ?? '',
          Descripción: producto.description ?? '',
          Unidades: producto.unidades ?? '',
        });
      });
    });

    // Crear hoja de trabajo
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Ubicaciones': worksheet },
      SheetNames: ['Ubicaciones'],
    };
    XLSX.writeFile(workbook, `${this.fileName}.xlsx`);
    this.cerrarModal();
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  mostrarDetalles() {
    this.mostrarModal = true;
  }
}
