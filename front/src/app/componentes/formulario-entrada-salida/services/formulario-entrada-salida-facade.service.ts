import { Injectable, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { FormularioValidationService } from './formulario-validation.service';
import { StockManagerService } from '../../../services/stock-manager.service';
import { AgenciaTransporte } from 'src/app/models/agencia-transporte.model';
import { Colaborador } from 'src/app/models/colaborador.model';
import { Entrada } from 'src/app/models/entrada.model';
import { Estado } from 'src/app/models/estado.model';
import { OtraDireccion } from 'src/app/models/otraDireccion.model';
import { PDV } from 'src/app/models/pdv.model';
import { Perfumeria } from 'src/app/models/perfumeria.model';
import { Producto } from 'src/app/models/producto.model';
import { ProductoEntrada } from 'src/app/models/productoEntrada.model';
import { ProductoSalida } from 'src/app/models/productoSalida.model';
import { Salida } from 'src/app/models/salida.model';
import { AgenciasTransporteService } from 'src/app/services/agencias-transporte.service';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { EntradaServices } from 'src/app/services/entrada.service';
import { EstadoService } from 'src/app/services/estado.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { SalidaServices } from 'src/app/services/salida.service';

@Injectable()
export class FormularioFacadeService {
  constructor(
    private entradaService: EntradaServices,
    private salidaService: SalidaServices,
    private productoService: ProductoServices,
    private direccionesService: DireccionesService,
    private agenciasTransporteService: AgenciasTransporteService,
    private estadosService: EstadoService,
    private validationService: FormularioValidationService,
    private stockManager: StockManagerService
  ) {}

  // ============================================
  // CARGA INICIAL DE DATOS
  // ============================================

  cargarDatosIniciales(
    esEntrada: boolean,
    esSalida: boolean
  ): Observable<{
    estados: Estado[];
    agencias?: AgenciaTransporte[];
  }> {
    const estados$ = this.estadosService.getEstados();

    if (esSalida) {
      const agencias$ = this.agenciasTransporteService.getAgenciasTransporteActivas();
      return forkJoin({
        estados: estados$,
        agencias: agencias$
      });
    }

    return estados$.pipe(map(estados => ({ estados })));
  }

  // ============================================
  // GESTIÓN DE PERFUMERÍAS, PDVs, COLABORADORES
  // ============================================

  cargarPerfumerias(nombre: string, pageIndex: number, pageSize: number): Observable<Perfumeria[]> {
    return this.direccionesService
      .getPerfumeriasActivasByNombrePaginado(nombre, pageIndex, pageSize)
      .pipe(map(data => data.content));
  }

  cargarPDVsPerfumeria(nombrePerfumeria: string): Observable<PDV[]> {
    return this.direccionesService.getPdvsPerfumeria(nombrePerfumeria);
  }

  cargarPDVsPerfumeriaByNombre(
    nombrePerfumeria: string,
    nombrePdv: string
  ): Observable<PDV[]> {
    return this.direccionesService.getPDVsDeUnaPerfumeriaByNombres(nombrePerfumeria, nombrePdv);
  }

  cargarColaboradores(): Observable<Colaborador[]> {
    return this.direccionesService.getColaboradoresActivos();
  }

  cargarColaboradoresPorNombre(
    nombre: string,
    pageIndex: number,
    pageSize: number
  ): Observable<Colaborador[]> {
    return this.direccionesService
      .getColaboradoresActivosByNombrePaginado(nombre, pageIndex, pageSize)
      .pipe(map(data => data.content));
  }

  cargarOtrasDirecciones(): Observable<OtraDireccion[]> {
    return this.direccionesService.getOtrasDirecciones();
  }

  cargarOtrasDireccionesPorNombre(
    nombre: string,
    pageIndex: number,
    pageSize: number
  ): Observable<OtraDireccion[]> {
    return this.direccionesService
      .getOtrasDireccionesByNombrePaginado(nombre, pageIndex, pageSize)
      .pipe(map(data => data.content));
  }

  // ============================================
  // BÚSQUEDA DE PRODUCTOS
  // ============================================

  buscarProductoPorReferencia(referencia: string): Observable<any> {
    return this.productoService.getProductoPorReferencia(referencia.trim());
  }

  cargarVisuales(pageIndex: number, pageSize: number): Observable<Producto[]> {
    return this.productoService
      .getVisualesPaginado(pageIndex, pageSize)
      .pipe(map(data => data.content));
  }

  cargarVisualesPorDescripcion(
    descripcion: string,
    pageIndex: number,
    pageSize: number
  ): Observable<Producto[]> {
    return this.productoService
      .getVisualesPorDescripcionPaginado(descripcion, pageIndex, pageSize)
      .pipe(map(data => data.content));
  }

  cargarProductosSinReferencia(pageIndex: number, pageSize: number): Observable<Producto[]> {
    return this.productoService
      .getProductosSinReferenciaPaginado(pageIndex, pageSize)
      .pipe(map(data => data.content));
  }

  cargarProductosSinReferenciaPorDescripcion(
    descripcion: string,
    pageIndex: number,
    pageSize: number
  ): Observable<Producto[]> {
    return this.productoService
      .getProductosSinReferenciaPorDescripcionPaginado(descripcion, pageIndex, pageSize)
      .pipe(map(data => data.content));
  }

  // ============================================
  // GUARDAR ENTRADA/SALIDA
  // ============================================

  guardarEntrada(entrada: Entrada): Observable<Entrada> {
    return this.entradaService.newEntrada(entrada);
  }

  guardarSalida(salida: Salida): Observable<Salida> {
    return this.salidaService.newSalida(salida);
  }

  actualizarEntrada(entrada: Entrada): Observable<Entrada> {
    return this.entradaService.updateEntrada(entrada);
  }

  actualizarSalida(salida: Salida): Observable<Salida> {
    return this.salidaService.updateSalida(salida);
  }

  // ============================================
  // CONSTRUCCIÓN DE OBJETOS PARA GUARDAR
  // ============================================

  construirEntrada(form: FormGroup, pendiente: boolean): Entrada {
    const entrada: Entrada = {
      origen: form.get('otroOrigenDestino')?.value,
      colaborador: form.get('colaborador')?.value,
      perfumeria: form.get('perfumeria')?.value,
      pdv: form.get('pdv')?.value,
      dcs: form.get('dcs')?.value,
      estado: !pendiente,
      productos: form.get('productos')?.value.map((p: any) => this.mapearProductoEntrada(p)),
      rellena: false,
      fechaRecepcion: form.get('fechaRecepcionEnvio')?.value
    };

    entrada.rellena = this.todosLosCamposRellenosEntrada(entrada);
    return entrada;
  }

  construirSalida(form: FormGroup, pendiente: boolean): Salida {
    const salida: Salida = {
      destino: form.get('otroOrigenDestino')?.value,
      direccion: form.get('direccion')?.value,
      poblacion: form.get('poblacion')?.value,
      provincia: form.get('provincia')?.value,
      cp: form.get('cp')?.value,
      telefono: form.get('telefono')?.value,
      colaborador: form.get('colaborador')?.value,
      perfumeria: form.get('perfumeria')?.value,
      pdv: form.get('pdv')?.value,
      estado: !pendiente,
      productos: form.get('productos')?.value.map((p: any) => this.mapearProductoSalida(p)),
      rellena: false,
      fechaEnvio: form.get('fechaRecepcionEnvio')?.value
    };

    salida.rellena = this.todosLosCamposRellenosSalida(salida);
    return salida;
  }

  private mapearProductoEntrada(producto: any): ProductoEntrada {
    return {
      ref: producto.ref,
      description: producto.description,
      unidades: producto.unidades,
      ubicacion: producto.ubicacion,
      palets: producto.palets,
      bultos: producto.bultos,
      observaciones: producto.observaciones,
      comprobado: producto.comprobado,
      estado: producto.estado || null
    };
  }

  private mapearProductoSalida(producto: any): ProductoSalida {
    return {
      productoId: producto.productoId,
      ref: producto.ref,
      description: producto.description,
      unidades: producto.unidades,
      unidadesPedidas: producto.unidadesPedidas,
      ubicacion: producto.ubicacion,
      palets: producto.palets,
      bultos: producto.bultos,
      formaEnvio: producto.formaEnvio,
      observaciones: producto.observaciones,
      comprobado: producto.comprobado,
      estado: producto.estado
    };
  }

  private todosLosCamposRellenosEntrada(entrada: Entrada): boolean {
    return entrada.productos!.every(
      producto =>
        producto.description &&
        producto.unidades &&
        producto.unidades > 0 &&
        producto.ubicacion &&
        producto.ubicacion !== '' &&
        producto.palets! >= 0 &&
        producto.bultos! >= 0 &&
        producto.comprobado &&
        (producto.estado != null || this.validationService.esProductoEspecial(producto.ref!))
    );
  }

  private todosLosCamposRellenosSalida(salida: Salida): boolean {
    return salida.productos!.every(
      producto =>
        producto.description &&
        producto.unidades &&
        producto.unidades > 0 &&
        producto.ubicacion &&
        producto.ubicacion !== '' &&
        producto.palets! >= 0 &&
        producto.bultos! >= 0 &&
        producto.formaEnvio &&
        producto.formaEnvio.trim() !== '' &&
        producto.comprobado &&
        (producto.estado != null || this.validationService.esProductoEspecial(producto.ref!))
    );
  }

  // ============================================
  // HELPERS
  // ============================================

  formatearFecha(fecha: any): string | null {
    if (!fecha) return null;

    if (fecha instanceof Date || typeof fecha === 'string') {
      return new Date(fecha).toISOString().split('T')[0];
    }

    if (typeof fecha === 'number') {
      const excelDate = new Date(Date.UTC(1900, 0, fecha - 1));
      return excelDate.toISOString().split('T')[0];
    }

    return null;
  }
}