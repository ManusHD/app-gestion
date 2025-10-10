import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { lastValueFrom, Observable, of } from 'rxjs';

import { Mueble } from 'src/app/models/mueble.model';
import { ProductoMueble } from 'src/app/models/productoMueble.model';
import { MuebleService } from 'src/app/services/mueble.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { EstadoService } from 'src/app/services/estado.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';

import { Perfumeria } from 'src/app/models/perfumeria.model';
import { PDV } from 'src/app/models/pdv.model';
import { OtraDireccion } from 'src/app/models/otraDireccion.model';
import { Colaborador } from 'src/app/models/colaborador.model';
import { Estado } from 'src/app/models/estado.model';
import { Producto } from 'src/app/models/producto.model';
import { TarifaService } from 'src/app/services/tarifas.service';
import { Tarifa } from 'src/app/models/tarifa.model';

@Component({
  selector: 'app-formulario-mueble',
  templateUrl: './formulario-mueble.component.html',
  styleUrls: ['./formulario-mueble.component.css'],
})
export class FormularioMuebleComponent implements OnInit {
  @Input() pestanaPadre: String = '';
  @Input() detallesMueble?: Mueble = undefined;

  muebleForm!: FormGroup;
  mostrarFormulario: boolean = false;
  btnSubmitActivado = true;
  productosNuevos: Set<number> = new Set();

  // Datos para dropdowns
  perfumerias: Perfumeria[] = [];
  pdvs: PDV[] = [];
  colaboradores: Colaborador[] = [];
  otrasDirecciones: OtraDireccion[] = [];
  estados: Estado[] = [];
  visuales: Producto[] = [];
  productosSR: Producto[] = [];

  // Estados de selección
  perfumeriaSeleccionada: Perfumeria | null = null;
  pdvSeleccionado: PDV | null = null;
  colaboradorSeleccionado: Colaborador | null = null;
  otraDireccionSeleccionada: OtraDireccion | null = null;
  activeCampoUnico: string | null = null;
  activeRowIndex: number | null = null;

  // Paginación
  pageSize = 10;
  pageIndex = 0;

  // Estados dinámicos para productos
  estadosDisponiblesPorProducto: { [index: number]: string[] } = {};
  stockDisponiblePorProducto: { [key: string]: number } = {};

  // Variables adicionales para productos de retirada
  visualesRetirada: Producto[] = [];
  productosSRRetirada: Producto[] = [];
  activeRowRetiradaIndex: number | null = null;
  productosRetiradaNuevos: Set<number> = new Set();
  estadosDisponiblesPorProductoRetirada: { [index: number]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private muebleService: MuebleService,
    private productoService: ProductoServices,
    private direccionesService: DireccionesService,
    private estadosService: EstadoService,
    private carga: PantallaCargaService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private tarifaService: TarifaService
  ) {}

  ngOnInit() {
    this.muebleForm = this.createForm();
    this.cargarDatosIniciales();
    this.inicializarFormulario();
    this.configurarEventos();
  }

  createForm(): FormGroup {
    const esDetallePendiente = this.pestanaPadre === 'detallePrevisionMueble';
    const esDetalleRealizado = this.pestanaPadre === 'detalleRealizadoMueble';

    return this.fb.group({
      // Campos que solo se editan en previsión (bloqueados en pendientes y realizados)
      fechaOrdenTrabajo: [
        { value: '', disabled: esDetallePendiente || esDetalleRealizado },
        Validators.required,
      ],
      fechaAsignacion: [
        { value: '', disabled: esDetallePendiente || esDetalleRealizado },
        Validators.required,
      ],
      tipoAccion: [
        { value: '', disabled: esDetallePendiente || esDetalleRealizado },
        Validators.required,
      ],
      perfumeria: [{ value: '', disabled: esDetallePendiente || esDetalleRealizado }],
      pdv: [{ value: '', disabled: esDetallePendiente || esDetalleRealizado }],
      colaborador: [{ value: '', disabled: esDetallePendiente || esDetalleRealizado }],
      otroDestino: [{ value: '', disabled: esDetallePendiente || esDetalleRealizado }],
      indicaciones: [{ value: '', disabled: esDetallePendiente || esDetalleRealizado }],
      
      // Campos que se pueden editar en pendientes y realizados
      fechaPrevistaRealizacion: ['', Validators.required],
      fechaRealizacion: [''],
      presupuesto: ['', [Validators.required, Validators.min(0)]],
      costeColaborador: ['', Validators.required],
      costeEnvio: ['', Validators.required],
      importeFacturar: ['', Validators.min(0)],
      incidencias: [''],
      
      // Campos siempre deshabilitados (calculados o de dirección)
      direccion: [{ value: '', disabled: true }],
      poblacion: [{ value: '', disabled: true }],
      provincia: [{ value: '', disabled: true }],
      cp: [{ value: '', disabled: true }],
      telefono: [{ value: '', disabled: true }],
      costeTotal: [{ value: '', disabled: true }],
      
      // Arrays de productos
      productos: this.fb.array([]),
      productosRetirada: this.fb.array([]),
    });
  }

  private createProductoGroup(): FormGroup {
    return this.fb.group({
      ref: ['', Validators.required],
      description: ['', Validators.required],
      estado: ['', Validators.required],
      unidades: ['', [Validators.required, Validators.min(1)]],
    });
  }

  get productosControls() {
    return this.muebleForm.get('productos') as FormArray;
  }

  get productosRetiradaControls() {
    return this.muebleForm.get('productosRetirada') as FormArray;
  }

  onTipoAccionChange() {
    const tipoAccion = this.muebleForm.get('tipoAccion')?.value;

    if (tipoAccion === 'INTERCAMBIO') {
      // Asegurar que ambas listas tengan al menos un producto
      if (this.productosControls.length === 0) {
        this.agregarProducto();
      }
      if (this.productosRetiradaControls.length === 0) {
        this.agregarProductoRetirada();
      }

      // Validar stock para productos de implantación existentes
      for (let i = 0; i < this.productosControls.length; i++) {
        this.validarStockProducto(i);
        
      }
    } else if (tipoAccion === 'IMPLANTACION') {
      // Limpiar productos de retirada si no es intercambio
      while (this.productosRetiradaControls.length) {
        this.productosRetiradaControls.removeAt(0);
      }

      // Validar stock para productos de implantación
      for (let i = 0; i < this.productosControls.length; i++) {
        this.validarStockProducto(i);
      }
    } else {
      // Es RETIRADA
      // Limpiar productos de retirada si no es intercambio
      while (this.productosRetiradaControls.length) {
        this.productosRetiradaControls.removeAt(0);
      }

      // Limpiar validaciones de stock
      this.stockDisponiblePorProducto = {};
    }
  }

  esIntercambio(): boolean {
    return this.muebleForm.get('tipoAccion')?.value === 'INTERCAMBIO';
  }
  
  agregarProductoRetirada() {
    const newProduct = this.createProductoGroup();
    
    if (!this.esPrevision()) {
      newProduct.get('ref')?.disable();
      newProduct.get('description')?.disable();
      newProduct.get('estado')?.disable();
      newProduct.get('unidades')?.disable();
    }
    
    this.productosRetiradaControls.push(newProduct);
    
    setTimeout(() => {
      const inputsRef = Array.from(
        document.querySelectorAll<HTMLElement>(
          'tbody[formArrayName="productosRetirada"] input[formControlName="ref"]'
        )
      );
      inputsRef[inputsRef.length - 1]?.focus();
    });
  }

  eliminarProductoRetirada(index: number) {
    if (this.productosRetiradaControls.length > 1) {
      this.productosRetiradaControls.removeAt(index);

      // Actualizar indices en productosRetiradaNuevos
      const nuevosIndices = new Set<number>();
      this.productosRetiradaNuevos.forEach((idx) => {
        if (idx < index) {
          nuevosIndices.add(idx);
        } else if (idx > index) {
          nuevosIndices.add(idx - 1);
        }
      });
      this.productosRetiradaNuevos = nuevosIndices;
    }
  }

  isProductoRetiradaNuevo(index: number): boolean {
    const ref = this.productosRetiradaControls.at(index).get('ref')!.value;
    if (ref === 'VISUAL' || ref === 'SIN REFERENCIA') {
      return false;
    }
    return this.productosRetiradaNuevos.has(index);
  }

  buscarProductoRetiradaPorReferencia(index: number) {
    const refControl = this.productosRetiradaControls.at(index).get('ref');
    const descriptionControl = this.productosRetiradaControls
      .at(index)
      .get('description');
    const estadoControl = this.productosRetiradaControls
      .at(index)
      .get('estado');

    if (refControl!.value === 'VISUAL') {
      this.manejarProductoEspecialRetirada(index, 'VISUAL');
    } else if (refControl!.value === 'SIN REFERENCIA') {
      this.manejarProductoEspecialRetirada(index, 'SIN REFERENCIA');
    } else {
      refControl!.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((ref) => {
            if (ref?.trim()) {
              return this.productoService.getProductoPorReferencia(ref.trim());
            }
            return of(null);
          })
        )
        .subscribe({
          next: (response) => {
            this.procesarRespuestaProductoRetirada(response, index);
          },
          error: () => {
            this.productosRetiradaNuevos.add(index);
            this.limpiarCamposProductoRetirada(index);
          },
        });
    }
  }

  private manejarProductoEspecialRetirada(
    index: number,
    tipo: 'VISUAL' | 'SIN REFERENCIA'
  ) {
    const estadoControl = this.productosRetiradaControls
      .at(index)
      .get('estado');
    estadoControl?.clearValidators();
    estadoControl?.updateValueAndValidity();

    delete this.estadosDisponiblesPorProductoRetirada[index];

    const descriptionControl = this.productosRetiradaControls
      .at(index)
      .get('description');
    if (!descriptionControl?.value) {
      if (tipo === 'VISUAL') {
        this.cargarVisualesRetirada();
      } else {
        this.cargarProductosSinReferenciaRetirada();
      }
    } else {
      if (tipo === 'VISUAL') {
        this.cargarVisualesPorDescripcionRetirada(descriptionControl.value);
      } else {
        this.cargarProductosSinReferenciaPorDescripcionRetirada(
          descriptionControl.value
        );
      }
    }
  }

  private procesarRespuestaProductoRetirada(response: any, index: number) {
    const descriptionControl = this.productosRetiradaControls
      .at(index)
      .get('description');
    const estadoControl = this.productosRetiradaControls
      .at(index)
      .get('estado');

    if (response) {
      // Ahora SIEMPRE viene con el formato de array de estados
      if (response.estados && response.estados.length > 0) {
        descriptionControl!.setValue(response.description);
        this.productosRetiradaNuevos.delete(index);

        // Para productos de RETIRADA, NO establecer estadosDisponiblesPorProductoRetirada
        // para que use todos los estados del sistema (this.estados)
        // En lugar de filtrar por los estados del producto

        estadoControl?.setValidators([Validators.required]);
        estadoControl?.updateValueAndValidity();

        // No preseleccionar ningún estado automáticamente para retiradas
        if (!estadoControl?.value) {
          estadoControl?.setValue(null);
        }
      }
    } else {
      this.productosRetiradaNuevos.add(index);
      this.limpiarCamposProductoRetirada(index);
    }
  }

  private limpiarCamposProductoRetirada(index: number) {
    const descriptionControl = this.productosRetiradaControls
      .at(index)
      .get('description');
    const estadoControl = this.productosRetiradaControls
      .at(index)
      .get('estado');

    descriptionControl?.setValue('');
    estadoControl?.setValue(null);

    delete this.estadosDisponiblesPorProductoRetirada[index];
  }

  buscarProductoRetiradaEspecial(index: number) {
    const refControl = this.productosRetiradaControls.at(index).get('ref');
    const descriptionControl = this.productosRetiradaControls
      .at(index)
      .get('description');

    if (refControl!.value === 'VISUAL') {
      if (!descriptionControl || descriptionControl.value == '') {
        this.cargarVisualesRetirada();
      } else {
        this.cargarVisualesPorDescripcionRetirada(descriptionControl.value);
      }
    } else if (refControl!.value === 'SIN REFERENCIA') {
      if (!descriptionControl || descriptionControl.value == '') {
        this.cargarProductosSinReferenciaRetirada();
      } else {
        this.cargarProductosSinReferenciaPorDescripcionRetirada(
          descriptionControl.value
        );
      }
    }
  }

  private cargarVisualesRetirada() {
    this.productoService
      .getVisualesPaginado(this.pageIndex, this.pageSize)
      .subscribe(
        (data) => {
          this.visualesRetirada = data.content;
        },
        (error) => {
          console.error('Error al obtener los Visuales', error);
        }
      );
  }

  private cargarProductosSinReferenciaRetirada() {
    this.productoService
      .getProductosSinReferenciaPaginado(this.pageIndex, this.pageSize)
      .subscribe(
        (data) => {
          this.productosSRRetirada = data.content;
        },
        (error) => {
          console.error('Error al obtener productos sin referencia', error);
        }
      );
  }

  private cargarVisualesPorDescripcionRetirada(descripcion: string) {
    this.productoService
      .getVisualesPorDescripcionPaginado(
        descripcion,
        this.pageIndex,
        this.pageSize
      )
      .subscribe(
        (data) => {
          this.visualesRetirada = data.content;
        },
        (error) => {
          console.error('Error al obtener los Visuales', error);
        }
      );
  }

  private cargarProductosSinReferenciaPorDescripcionRetirada(
    descripcion: string
  ) {
    this.productoService
      .getProductosSinReferenciaPorDescripcionPaginado(
        descripcion,
        this.pageIndex,
        this.pageSize
      )
      .subscribe(
        (data) => {
          this.productosSRRetirada = data.content;
        },
        (error) => {
          console.error('Error al obtener productos sin referencia', error);
        }
      );
  }

  selectVisualRetirada(i: number, visual: Producto) {
    this.productosRetiradaControls
      .at(i)
      .get('description')
      ?.setValue(visual.description);
    this.visualesRetirada = [];
  }

  selectProductosSRRetirada(i: number, sinReferencia: Producto) {
    this.productosRetiradaControls
      .at(i)
      .get('description')
      ?.setValue(sinReferencia.description);
    this.productosSRRetirada = [];
  }

  setActiveRowRetirada(index: number): void {
    this.activeRowRetiradaIndex = index;
  }

  clearActiveRowRetirada(): void {
    setTimeout(() => {
      this.activeRowRetiradaIndex = null;
    }, 200);
  }

  onEstadoChangeRetirada(index: number) {
    // No hay validación de stock para productos de retirada
  }

  getEstadosDisponiblesRetirada(index: number): string[] {
    // Si no hay estados específicos para este índice, devolver TODOS los estados del sistema
    if (!this.estadosDisponiblesPorProductoRetirada[index]) {
      return this.estados.map((e) => e.nombre!);
    }
    return this.estadosDisponiblesPorProductoRetirada[index];
  }

  refValidaRetiradaIndex(i: number): boolean {
    const ref = this.productosRetiradaControls.at(i).get('ref')!.value;
    return this.refValida(ref);
  }

  descriptionValidaRetirada(i: number): boolean {
    const description = this.productosRetiradaControls
      .at(i)
      .get('description')!.value;
    return description && description.trim().length > 0;
  }

  campoVacioRetirada(nombreCampo: string, index: number): boolean {
    const control = this.productosRetiradaControls.at(index).get(nombreCampo);
    return !control!.valid && control!.touched;
  }

  esEstadoRequeridoRetirada(index: number): boolean {
    const refControl = this.productosRetiradaControls.at(index).get('ref');
    const referencia = refControl?.value;
    return !this.esProductoEspecial(referencia);
  }

  private construirMueble(): Mueble {
    const formValue = this.muebleForm.getRawValue();

    // Determinar si los productos son de retirada según el tipo de acción
    const esRetirada = formValue.tipoAccion === 'RETIRADA';

    console.log(formValue.tipoAccion)
  
    const productos: ProductoMueble[] = formValue.productos.map((p: any) => ({
      ref: p.ref,
      description: p.description,
      estado: p.estado,
      unidades: p.unidades,
      esRetirada: esRetirada, // true para RETIRADA, false para IMPLANTACION
    }));
  
    // Si es intercambio, agregar productos de retirada
    if (formValue.tipoAccion === 'INTERCAMBIO') {
      const productosRetirada: ProductoMueble[] =
        formValue.productosRetirada.map((p: any) => ({
          ref: p.ref,
          description: p.description,
          estado: p.estado,
          unidades: p.unidades,
          esRetirada: true, // Productos de retirada en intercambio
        }));
      productos.push(...productosRetirada);
    }

    return {
      fechaOrdenTrabajo: formValue.fechaOrdenTrabajo,
      fechaAsignacion: formValue.fechaAsignacion,
      fechaPrevistaRealizacion: formValue.fechaPrevistaRealizacion || null,
      fechaRealizacion: formValue.fechaRealizacion || null,
      perfumeria: formValue.perfumeria || null,
      pdv: formValue.pdv || null,
      colaborador: formValue.colaborador || null,
      otroDestino: formValue.otroDestino || null,
      direccion: formValue.direccion,
      poblacion: formValue.poblacion,
      provincia: formValue.provincia,
      cp: formValue.cp,
      telefono: formValue.telefono,
      tipoAccion: formValue.tipoAccion,
      presupuesto: formValue.presupuesto || 0,
      indicaciones: formValue.indicaciones,
      incidencias: formValue.incidencias,
      costeColaborador: formValue.costeColaborador,
      costeEnvio: formValue.costeEnvio,
      costeTotal: formValue.costeTotal || null,
      importeFacturar: formValue.importeFacturar || null,
      estado: false,
      productos: productos,
    };
  }

  private previsionEsValida(): boolean {
    const fechaOrdenTrabajo = this.muebleForm.get('fechaOrdenTrabajo')?.value;
    const fechaAsignacion = this.muebleForm.get('fechaAsignacion')?.value;
    const tipoAccion = this.muebleForm.get('tipoAccion')?.value;
    const presupuesto = this.muebleForm.get('presupuesto')?.value;
    const hayProductos = this.productosControls.length > 0;
    let productosValidos = this.productosSonValidos();
    const destinosValidos = this.previsionEsValidaCampoSimple();

    // Si es intercambio, validar también productos de retirada
    if (this.esIntercambio()) {
      const hayProductosRetirada = this.productosRetiradaControls.length > 0;
      const productosRetiradaValidos = this.productosRetiradaSonValidos();

      if (!hayProductosRetirada) {
        this.snackBarError(
          'Debe agregar al menos un producto a retirar en el intercambio'
        );
        return false;
      }

      if (!productosRetiradaValidos) {
        this.snackBarError(
          'Todos los productos de retirada deben estar completos y válidos'
        );
        return false;
      }

      productosValidos = productosValidos && productosRetiradaValidos;
    }

    let esValida =
      fechaOrdenTrabajo &&
      fechaAsignacion &&
      tipoAccion &&
      presupuesto !== null &&
      presupuesto !== '' &&
      hayProductos &&
      productosValidos &&
      destinosValidos;

    if (!fechaOrdenTrabajo) {
      this.snackBarError('La fecha de orden de trabajo es obligatoria');
    } else if (!fechaAsignacion) {
      this.snackBarError('La fecha de asignación es obligatoria');
    } else if (!tipoAccion) {
      this.snackBarError('El tipo de acción es obligatorio');
    } else if (presupuesto === null || presupuesto === '') {
      this.snackBarError('El presupuesto es obligatorio');
    } else if (!destinosValidos) {
      this.snackBarError('Debe seleccionar un destino válido.');
    } else if (!hayProductos) {
      this.snackBarError('Debe agregar al menos un producto');
    } else if (!productosValidos) {
      this.snackBarError('Todos los productos deben estar completos y válidos');
    }

    return esValida;
  }

  private resetForm() {
    this.muebleForm.reset();
    this.productosNuevos.clear();
    this.productosRetiradaNuevos.clear();
    this.estadosDisponiblesPorProducto = {};
    this.estadosDisponiblesPorProductoRetirada = {};
    this.stockDisponiblePorProducto = {};

    this.muebleForm.patchValue({
      fechaOrdenTrabajo: new Date().toISOString().split('T')[0],
    });

    // Limpiar ambas listas de productos
    while (this.productosControls.length) {
      this.productosControls.removeAt(0);
    }
    while (this.productosRetiradaControls.length) {
      this.productosRetiradaControls.removeAt(0);
    }

    this.agregarProducto();
  }

  private async cargarDatosExistentes() {
    const tipoAccion = this.detallesMueble!.tipoAccion;

    // Cargar productos existentes según el tipo de acción
    this.detallesMueble!.productos?.forEach((producto) => {
      if (tipoAccion === 'INTERCAMBIO') {
        // Para INTERCAMBIO: separar por esRetirada
        if (producto.esRetirada) {
          this.productosRetiradaControls.push(this.createProductoGroup());
        } else {
          this.productosControls.push(this.createProductoGroup());
        }
      } else {
        // Para IMPLANTACIÓN y RETIRADA: todos van a productosControls
        this.productosControls.push(this.createProductoGroup());
      }
    });

    // Cargar PDV si existe
    if (this.detallesMueble!.pdv != null && this.detallesMueble!.pdv !== '') {
      await new Promise<void>((resolve) => {
        this.direccionesService
          .getPdv(this.detallesMueble!.pdv!)
          .subscribe((pdv) => {
            this.selectPdv(pdv);
            resolve();
          });
      });
    }

    // Cargar Colaborador si existe
    if (this.detallesMueble!.colaborador != null && this.detallesMueble!.colaborador !== '') {
      await new Promise<void>((resolve) => {
        this.direccionesService
          .getColaborador(this.detallesMueble!.colaborador!)
          .subscribe((colaborador) => {
            this.colaboradorSeleccionado = colaborador;
            resolve();
          });
      });
    }

    // Cargar Otra Dirección si existe
    if (this.detallesMueble!.otroDestino != null && this.detallesMueble!.otroDestino !== '') {
      await new Promise<void>((resolve) => {
        this.direccionesService
          .getOtrasDireccionesByNombre(this.detallesMueble!.otroDestino!)
          .subscribe((direcciones: OtraDireccion[]) => {
            if (direcciones && direcciones.length > 0) {
              this.otraDireccionSeleccionada = direcciones[0];
            }
            resolve();
          });
      });
    }

    // Cargar tarifa por kilómetro
    let tarifaKms = 0;
    await new Promise<void>((resolve) => {
      this.tarifaService.getTarifasByNombre('KM').subscribe(
        (data: any) => {
          const tarifas: Tarifa[] = data.content;
          tarifaKms = tarifas[0]?.importe || 0;
          console.log("Tarifa/KM: ", tarifaKms);
          resolve();
      });
    });
    
    const costeTipoAccion = await lastValueFrom(this.getCosteTipoAccion());

    // Calcular coste de envío con PRIORIDAD: Colaborador > Otro Destino > PDV
    let costeEnvio = costeTipoAccion;
    let distancia = 0;
    let tarifaExtra = 0;

    if (this.colaboradorSeleccionado && this.colaboradorSeleccionado.distancia != null) {
      distancia = this.colaboradorSeleccionado.distancia;
      tarifaExtra = (this.colaboradorSeleccionado as any).tarifaExtra || 0;
      console.log("Usando distancia del Colaborador:", distancia);
    } else if (this.otraDireccionSeleccionada && this.otraDireccionSeleccionada.distancia != null) {
      distancia = this.otraDireccionSeleccionada.distancia;
      tarifaExtra = (this.otraDireccionSeleccionada as any).tarifaExtra || 0;
      console.log("Usando distancia de Otra Dirección:", distancia);
    } else if (this.pdvSeleccionado && this.pdvSeleccionado.distancia != null) {
      distancia = this.pdvSeleccionado.distancia;
      tarifaExtra = this.pdvSeleccionado.tarifaExtra || 0;
      console.log("Usando distancia del PDV:", distancia);
    }

    costeEnvio += (distancia * 2 * tarifaKms) + tarifaExtra;
    
    // Rellenar el formulario
    this.muebleForm.patchValue({
      fechaOrdenTrabajo: this.detallesMueble!.fechaOrdenTrabajo,
      fechaAsignacion: this.detallesMueble!.fechaAsignacion,
      fechaPrevistaRealizacion: this.detallesMueble!.fechaPrevistaRealizacion,
      fechaRealizacion: this.detallesMueble!.fechaRealizacion,
      perfumeria: this.detallesMueble!.perfumeria || '',
      pdv: this.detallesMueble!.pdv || '',
      colaborador: this.detallesMueble!.colaborador || '',
      otroDestino: this.detallesMueble!.otroDestino || '',
      direccion: this.detallesMueble!.direccion || '',
      poblacion: this.detallesMueble!.poblacion || '',
      provincia: this.detallesMueble!.provincia || '',
      cp: this.detallesMueble!.cp || '',
      telefono: this.detallesMueble!.telefono || '',
      tipoAccion: this.detallesMueble!.tipoAccion,
      presupuesto: this.detallesMueble!.presupuesto || '',
      indicaciones: this.detallesMueble!.indicaciones || '',
      incidencias: this.detallesMueble!.incidencias || '',
      costeColaborador: this.detallesMueble!.costeColaborador,
      costeEnvio: costeEnvio,
      costeTotal: this.detallesMueble!.costeTotal || '',
      importeFacturar: this.detallesMueble!.importeFacturar || '',
    });

    // Rellenar productos según el tipo de acción
    if (tipoAccion === 'INTERCAMBIO') {
      // Para INTERCAMBIO: separar por esRetirada
      let indexImplantacion = 0;
      let indexRetirada = 0;

      this.detallesMueble!.productos?.forEach((producto) => {
        if (producto.esRetirada) {
          this.productosRetiradaControls.at(indexRetirada).patchValue({
            ref: producto.ref,
            description: producto.description,
            estado: producto.estado,
            unidades: producto.unidades,
          });
          indexRetirada++;
        } else {
          this.productosControls.at(indexImplantacion).patchValue({
            ref: producto.ref,
            description: producto.description,
            estado: producto.estado,
            unidades: producto.unidades,
          });
          this.validarStockProducto(indexImplantacion);
          indexImplantacion++;
        }
      });
    } else {
      // Para IMPLANTACIÓN y RETIRADA: todos van a productosControls
      this.detallesMueble!.productos?.forEach((producto, index) => {
        this.productosControls.at(index).patchValue({
          ref: producto.ref,
          description: producto.description,
          estado: producto.estado,
          unidades: producto.unidades,
        });
        
        // Solo validar stock para IMPLANTACIÓN
        if (tipoAccion === 'IMPLANTACION') {
          this.validarStockProducto(index);
        }
      });
    }

    // Al final del método, después de cargar todos los productos
    this.configurarEstadoFormulario();
  }

  getCosteTipoAccion(): Observable<number> {
    const tipoAccion = this.detallesMueble?.tipoAccion!;
    
    let nombreTarifa: string;
    
    switch (tipoAccion) {
      case 'IMPLANTACION':
      case 'RETIRADA':
        nombreTarifa = 'RECOGIDA';
        break;
      case 'INTERCAMBIO':
        nombreTarifa = 'INTERCAMBIO EN LA MISMA POBLACIÓN';
        break;
      default:
        return of(0); // Devuelve Observable de 0
    }
    
    return this.tarifaService.getTarifasByNombre(nombreTarifa).pipe(
      map((data: any) => {
        const tarifas: Tarifa[] = data.content;
        return tarifas[0].importe || 0;
      }),
      catchError(() => of(0)) // En caso de error, devolver 0
    );
  }

  private configurarEstadoFormulario() {
    const esEditable = this.esPrevision();
    
    if (!esEditable) {
      // Deshabilitar todos los productos de implantación
      this.productosControls.controls.forEach((control) => {
        control.get('ref')?.disable();
        control.get('description')?.disable();
        control.get('estado')?.disable();
        control.get('unidades')?.disable();
      });
  
      // Deshabilitar todos los productos de retirada
      this.productosRetiradaControls.controls.forEach((control) => {
        control.get('ref')?.disable();
        control.get('description')?.disable();
        control.get('estado')?.disable();
        control.get('unidades')?.disable();
      });
    }
  }

  private marcarCamposInvalidos() {
    Object.keys(this.muebleForm.controls).forEach((key) => {
      const control = this.muebleForm.get(key);
      control?.markAsTouched();
    });

    this.productosControls.controls.forEach((control) => {
      const productoGroup = control as FormGroup;
      Object.keys(productoGroup.controls).forEach((key) => {
        const productoControl = productoGroup.get(key);
        productoControl?.markAsTouched();
      });
    });

    this.productosRetiradaControls.controls.forEach((control) => {
      const productoGroup = control as FormGroup;
      Object.keys(productoGroup.controls).forEach((key) => {
        const productoControl = productoGroup.get(key);
        productoControl?.markAsTouched();
      });
    });
  }

  private cargarDatosIniciales() {
    this.cargarEstados();
    this.cargarPerfumerias('a');
    this.cargarTodasOtrasDirecciones();
    this.cargarColaboradores('a');
  }

  private inicializarFormulario() {
    if (!this.detallesMueble) {
      this.mostrarFormulario = true;
      this.muebleForm.patchValue({
        fechaOrdenTrabajo: new Date().toISOString().split('T')[0],
      });
      this.agregarProducto();
    } else {
      this.mostrarFormulario = true;
      this.cargarDatosExistentes();
    }
  }

  private configurarEventos() {
    // Evento para perfumería
    this.muebleForm
      .get('perfumeria')
      ?.valueChanges.pipe(debounceTime(300))
      .subscribe((value) => {
        if (value == '' || value == null) {
          this.muebleForm.get('pdv')!.setValue('');
          // Solo limpiar colaborador si estaba asociado a un PDV
          if (this.pdvSeleccionado?.colaborador) {
            this.muebleForm.get('colaborador')!.setValue('');
            this.colaboradorSeleccionado = null;
          }
          this.pdvs = [];
          this.perfumeriaSeleccionada = null;
          this.pdvSeleccionado = null;
          this.cargarPerfumerias('a');
          
          // Solo limpiar dirección si no hay otras fuentes
          this.limpiarCamposDireccion();
        } else {
          this.cargarPerfumerias(value);
        }
      });

    // Evento para PDV
    this.muebleForm
      .get('pdv')
      ?.valueChanges.pipe(debounceTime(300))
      .subscribe((value) => {
        const perfumeria = this.muebleForm.get('perfumeria')?.value;
        if (value == '' || value == null) {
          // Solo limpiar colaborador si estaba asociado al PDV anterior
          if (this.pdvSeleccionado?.colaborador) {
            this.muebleForm.get('colaborador')!.setValue('');
            this.colaboradorSeleccionado = null;
          }
          this.pdvSeleccionado = null;
          
          // Solo limpiar dirección si no hay otras fuentes
          this.limpiarCamposDireccion();
          
          if (perfumeria) {
            this.cargarPDVs();
          }
        } else {
          this.cargarPDVsPerfumeriaByNombre(perfumeria, value);
        }
      });

    // Rellenar dirección automáticamente desde PDV
    this.muebleForm.get('pdv')?.valueChanges.subscribe((value) => {
      if (value) {
        this.rellenarDireccionPDV(value);
      }
    });

    // Evento para colaborador
    this.muebleForm
      .get('colaborador')
      ?.valueChanges.pipe(debounceTime(300))
      .subscribe((value) => {
        if (value == '' || value == null) {
          this.colaboradorSeleccionado = null;
          
          // Solo limpiar dirección si no hay otras fuentes
          this.limpiarCamposDireccion();
          
          this.cargarColaboradores('a');
        } else {
          this.cargarColaboradores(value);
        }
      });

    // Evento para otros destinos
    this.muebleForm
      .get('otroDestino')
      ?.valueChanges.pipe(debounceTime(300))
      .subscribe((value) => {
        if (value == '' || value == null) {
          this.otraDireccionSeleccionada = null;
          
          // Solo limpiar dirección si no hay otras fuentes
          this.limpiarCamposDireccion();
          
          this.cargarTodasOtrasDirecciones();
        } else {
          this.cargarOtrasDirecciones(value);
        }
      });
  }

  // Métodos para manejar productos
  agregarProducto() {
    const newProduct = this.createProductoGroup();
    
    if (!this.esPrevision()) {
      newProduct.get('ref')?.disable();
      newProduct.get('description')?.disable();
      newProduct.get('estado')?.disable();
      newProduct.get('unidades')?.disable();
    }
    
    this.productosControls.push(newProduct);
    
    setTimeout(() => {
      const inputsRef = Array.from(
        document.querySelectorAll<HTMLElement>('input[formControlName="ref"]')
      );
      inputsRef[inputsRef.length - 1]?.focus();
    });
  }

  eliminarProducto(index: number) {
    if (this.productosControls.length > 1) {
      this.productosControls.removeAt(index);

      // Actualizar indices en productosNuevos
      const nuevosIndices = new Set<number>();
      this.productosNuevos.forEach((idx) => {
        if (idx < index) {
          nuevosIndices.add(idx);
        } else if (idx > index) {
          nuevosIndices.add(idx - 1);
        }
      });
      this.productosNuevos = nuevosIndices;
    }
  }

  // Métodos de validación de productos
  buscarProductoPorReferencia(index: number) {
    const refControl = this.productosControls.at(index).get('ref');
    const descriptionControl = this.productosControls
      .at(index)
      .get('description');
    const estadoControl = this.productosControls.at(index).get('estado');

    if (refControl!.value === 'VISUAL') {
      this.manejarProductoEspecial(index, 'VISUAL');
    } else if (refControl!.value === 'SIN REFERENCIA') {
      this.manejarProductoEspecial(index, 'SIN REFERENCIA');
    } else {
      refControl!.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((ref) => {
            if (ref?.trim()) {
              return this.productoService.getProductoPorReferencia(ref.trim());
            }
            return of(null);
          })
        )
        .subscribe({
          next: (response) => {
            this.procesarRespuestaProducto(response, index);
            // Validar stock si es implantación o intercambio y ya tiene estado
            const tipoAccion = this.muebleForm.get('tipoAccion')?.value;
            if (
              (tipoAccion === 'IMPLANTACION' || tipoAccion === 'INTERCAMBIO') &&
              estadoControl?.value
            ) {
              this.validarStockProducto(index);
            }
          },
          error: () => {
            this.productosNuevos.add(index);
            this.limpiarCamposProducto(index);
          },
        });
    }
  }

  private manejarProductoEspecial(
    index: number,
    tipo: 'VISUAL' | 'SIN REFERENCIA'
  ) {
    const estadoControl = this.productosControls.at(index).get('estado');
    estadoControl?.clearValidators();
    estadoControl?.updateValueAndValidity();

    delete this.estadosDisponiblesPorProducto[index];

    const descriptionControl = this.productosControls
      .at(index)
      .get('description');
    if (!descriptionControl?.value) {
      if (tipo === 'VISUAL') {
        this.cargarVisuales();
      } else {
        this.cargarProductosSinReferencia();
      }
    } else {
      if (tipo === 'VISUAL') {
        this.cargarVisualesPorDescripcion(descriptionControl.value);
      } else {
        this.cargarProductosSinReferenciaPorDescripcion(
          descriptionControl.value
        );
      }
    }
  }

  private procesarRespuestaProducto(response: any, index: number) {
    const descriptionControl = this.productosControls
      .at(index)
      .get('description');
    const estadoControl = this.productosControls.at(index).get('estado');
    const tipoAccion = this.muebleForm.get('tipoAccion')?.value;

    if (response) {
      // Ahora SIEMPRE viene con el formato de array de estados
      if (response.estados && response.estados.length > 0) {
        descriptionControl!.setValue(response.description);
        this.productosNuevos.delete(index);

        // Si es RETIRADA, mostrar TODOS los estados (no filtrar por stock)
        // Si es IMPLANTACION o INTERCAMBIO, filtrar solo estados con stock > 0
        if (tipoAccion === 'RETIRADA') {
          // Para RETIRADA: NO establecer estadosDisponiblesPorProducto
          // para que use todos los estados del sistema
          estadoControl?.setValidators([Validators.required]);
          estadoControl?.updateValueAndValidity();

          if (!estadoControl?.value) {
            estadoControl?.setValue(null);
          }
        } else {
          // Para IMPLANTACION e INTERCAMBIO: filtrar por stock > 0
          const estadosConStock = response.estados.filter(
            (e: any) => e.stock > 0
          );

          if (estadosConStock.length === 0) {
            // Si no hay estados con stock, tratar como producto no disponible
            this.productosNuevos.add(index);
            this.limpiarCamposProducto(index);
            this.snackBarError(
              `El producto ${response.referencia} no tiene stock disponible en ningún estado`
            );
            return;
          }

          // Configurar SOLO los estados que tienen stock > 0
          this.estadosDisponiblesPorProducto[index] = estadosConStock.map(
            (e: any) => e.estado
          );

          estadoControl?.setValidators([Validators.required]);
          estadoControl?.updateValueAndValidity();

          if (estadosConStock.length === 1) {
            // Si solo hay un estado con stock, preseleccionarlo automáticamente
            const unicoEstado = estadosConStock[0];
            if (!estadoControl?.value) {
              estadoControl?.setValue(unicoEstado.estado);
            }
          } else {
            // Si hay múltiples estados con stock, solo limpiar si no tienen valores
            if (!estadoControl?.value) {
              estadoControl?.setValue(null);
            }
          }

          // Validar stock después de procesar el producto
          setTimeout(() => {
            this.validarStockProducto(index);
          }, 100);
        }
      }
    } else {
      this.productosNuevos.add(index);
      this.limpiarCamposProducto(index);
    }
  }

  private limpiarCamposProducto(index: number) {
    const descriptionControl = this.productosControls
      .at(index)
      .get('description');
    const estadoControl = this.productosControls.at(index).get('estado');

    descriptionControl?.setValue('');
    estadoControl?.setValue(null);

    delete this.estadosDisponiblesPorProducto[index];
  }

  // Métodos para dropdown de productos especiales
  buscarProductoEspecial(index: number) {
    const refControl = this.productosControls.at(index).get('ref');
    const descriptionControl = this.productosControls
      .at(index)
      .get('description');

    if (refControl!.value === 'VISUAL') {
      if (!descriptionControl || descriptionControl.value == '') {
        this.cargarVisuales();
      } else {
        this.cargarVisualesPorDescripcion(descriptionControl.value);
      }
    } else if (refControl!.value === 'SIN REFERENCIA') {
      if (!descriptionControl || descriptionControl.value == '') {
        this.cargarProductosSinReferencia();
      } else {
        this.cargarProductosSinReferenciaPorDescripcion(
          descriptionControl.value
        );
      }
    }
  }

  selectVisual(i: number, visual: Producto) {
    this.productosControls
      .at(i)
      .get('description')
      ?.setValue(visual.description);
    this.visuales = [];
  }

  selectProductosSR(i: number, sinReferencia: Producto) {
    this.productosControls
      .at(i)
      .get('description')
      ?.setValue(sinReferencia.description);
    this.productosSR = [];
  }

  setActiveRow(index: number): void {
    this.activeRowIndex = index;
  }

  clearActiveRow(): void {
    setTimeout(() => {
      this.activeRowIndex = null;
    }, 200);
  }

  // Métodos para validación de stock en implantaciones
  onEstadoChange(index: number) {
    const tipoAccion = this.muebleForm.get('tipoAccion')?.value;
    if (tipoAccion === 'IMPLANTACION' || tipoAccion === 'INTERCAMBIO') {
      this.validarStockProducto(index);
    }
  }

  onUnidadesBlur(index: number) {
    const tipoAccion = this.muebleForm.get('tipoAccion')?.value;
    if (tipoAccion === 'IMPLANTACION' || tipoAccion === 'INTERCAMBIO') {
      this.validarStockProducto(index);
    }
  }

  private validarStockProducto(index: number) {
    const refControl = this.productosControls.at(index).get('ref');
    const estadoControl = this.productosControls.at(index).get('estado');
    const unidadesControl = this.productosControls.at(index).get('unidades');

    const referencia = refControl?.value;
    const estado = estadoControl?.value;
    const unidades = unidadesControl?.value;

    if (referencia && estado && !this.esProductoEspecial(referencia)) {
      this.productoService
        .getProductoPorReferenciaYEstado(referencia, estado)
        .subscribe({
          next: (producto) => {
            const key = `${index}-${referencia}-${estado}`;
            this.stockDisponiblePorProducto[key] = producto.stock || 0;

            if (unidadesControl) {
              unidadesControl.setValidators([
                Validators.required,
                Validators.min(1),
                Validators.max(producto.stock || 0),
              ]);
              unidadesControl.updateValueAndValidity();
            }
          },
          error: (error) => {
            console.error('Error al obtener stock:', error);
          },
        });
    }
  }

  unidadesExcedenStock(index: number): boolean {
    const tipoAccion = this.muebleForm.get('tipoAccion')?.value;
    if (tipoAccion !== 'IMPLANTACION' && tipoAccion !== 'INTERCAMBIO') {
      return false;
    }

    const unidadesControl = this.productosControls.at(index).get('unidades');
    const refControl = this.productosControls.at(index).get('ref');
    const estadoControl = this.productosControls.at(index).get('estado');

    const unidades = unidadesControl?.value || 0;
    const referencia = refControl?.value;
    const estado = estadoControl?.value;

    if (!referencia || !estado || this.esProductoEspecial(referencia)) {
      return false;
    }

    const key = `${index}-${referencia}-${estado}`;
    const stockDisponible = this.stockDisponiblePorProducto[key] || 0;
    return unidades > stockDisponible;
  }

  getMensajeStock(index: number): string {
    const tipoAccion = this.muebleForm.get('tipoAccion')?.value;
    if (tipoAccion !== 'IMPLANTACION' && tipoAccion !== 'INTERCAMBIO') {
      return '';
    }

    const refControl = this.productosControls.at(index).get('ref');
    const estadoControl = this.productosControls.at(index).get('estado');

    const referencia = refControl?.value;
    const estado = estadoControl?.value;

    if (referencia && estado && !this.esProductoEspecial(referencia)) {
      const key = `${index}-${referencia}-${estado}`;
      const stockDisponible = this.stockDisponiblePorProducto[key];

      if (stockDisponible !== undefined) {
        return `Stock disponible: ${stockDisponible}`;
      }
    }

    return '';
  }

  // Métodos de carga de datos
  private cargarEstados() {
    this.estadosService.getEstados().subscribe({
      next: (data) => {
        this.estados = data;
      },
      error: (error) => {
        console.error('Error al obtener los estados', error);
      },
    });
  }

  private cargarPerfumerias(perfumeria: string) {
    this.direccionesService
      .getPerfumeriasActivasByNombrePaginado(
        perfumeria,
        this.pageIndex,
        this.pageSize
      )
      .subscribe({
        next: (data) => {
          this.perfumerias = data.content;
        },
        error: (error) => {
          console.error('Error al obtener las Perfumerías', error);
        },
      });
  }

  private cargarPDVs(): Promise<void> {
    const perfumeria = this.muebleForm.get('perfumeria')?.value;
    if (perfumeria && perfumeria != '') {
      return new Promise((resolve, reject) => {
        this.direccionesService.getPdvsPerfumeria(perfumeria).subscribe(
          (data: PDV[]) => {
            this.pdvs = data;
            resolve();
          },
          (error) => {
            console.error('Error al obtener los PDVs', error);
            reject(error);
          }
        );
      });
    } else {
      return Promise.resolve();
    }
  }

  private cargarPDVsPerfumeriaByNombre(
    nombrePerfumeria: string,
    nombrePdv: string
  ) {
    this.direccionesService
      .getPDVsDeUnaPerfumeriaByNombres(nombrePerfumeria, nombrePdv)
      .subscribe((data: PDV[]) => {
        this.pdvs = data;
      });
  }

  private cargarColaboradores(nombre: string) {
    this.direccionesService
      .getColaboradoresActivosByNombrePaginado(
        nombre,
        this.pageIndex,
        this.pageSize
      )
      .subscribe({
        next: (data) => {
          this.colaboradores = data.content;
        },
        error: (error) => {
          console.error('Error al obtener los colaboradores', error);
        },
      });
  }

  private cargarTodasOtrasDirecciones() {
    this.direccionesService.getOtrasDirecciones().subscribe({
      next: (data) => {
        this.otrasDirecciones = data;
      },
      error: (error) => {
        console.error('Error al obtener otras direcciones', error);
      },
    });
  }

  private cargarOtrasDirecciones(direccion: string) {
    this.direccionesService
      .getOtrasDireccionesByNombrePaginado(
        direccion,
        this.pageIndex,
        this.pageSize
      )
      .subscribe({
        next: (data) => {
          this.otrasDirecciones = data.content;
        },
        error: (error) => {
          console.error('Error al obtener otras direcciones', error);
        },
      });
  }

  private cargarVisuales() {
    this.productoService
      .getVisualesPaginado(this.pageIndex, this.pageSize)
      .subscribe(
        (data) => {
          this.visuales = data.content;
        },
        (error) => {
          console.error('Error al obtener los Visuales', error);
        }
      );
  }

  private cargarProductosSinReferencia() {
    this.productoService
      .getProductosSinReferenciaPaginado(this.pageIndex, this.pageSize)
      .subscribe(
        (data) => {
          this.productosSR = data.content;
        },
        (error) => {
          console.error('Error al obtener productos sin referencia', error);
        }
      );
  }

  private cargarVisualesPorDescripcion(descripcion: string) {
    this.productoService
      .getVisualesPorDescripcionPaginado(
        descripcion,
        this.pageIndex,
        this.pageSize
      )
      .subscribe(
        (data) => {
          this.visuales = data.content;
        },
        (error) => {
          console.error('Error al obtener los Visuales', error);
        }
      );
  }

  private cargarProductosSinReferenciaPorDescripcion(descripcion: string) {
    this.productoService
      .getProductosSinReferenciaPorDescripcionPaginado(
        descripcion,
        this.pageIndex,
        this.pageSize
      )
      .subscribe(
        (data) => {
          this.productosSR = data.content;
        },
        (error) => {
          console.error('Error al obtener productos sin referencia', error);
        }
      );
  }

  // Métodos de selección de direcciones
  selectPerfumeria(perfumeria: Perfumeria) {
    this.muebleForm.patchValue({
      perfumeria: perfumeria.nombre,
      otroDestino: '',
      colaborador: '',
    });

    this.perfumeriaSeleccionada = perfumeria;
    this.cargarPDVPerfumeria(perfumeria.nombre!);
    this.activeCampoUnico = null;
    this.perfumerias = [];
  }

  selectPdv(pdv: PDV) {
    this.muebleForm.patchValue({
      pdv: pdv.nombre,
      otroDestino: '',
    });

    this.pdvSeleccionado = pdv;
    this.activeCampoUnico = null;
    this.pdvs = [];

    // Cargar el colaborador del PDV
    if (pdv.colaborador) {
      this.muebleForm.patchValue({
        colaborador: pdv.colaborador.nombre,
      });
      this.colaboradorSeleccionado = pdv.colaborador;
    }
  }

  selectColaborador(colaborador: Colaborador) {
    this.muebleForm.patchValue({
      colaborador: colaborador.nombre,
      otroDestino: '',
    });

    this.colaboradorSeleccionado = colaborador;
    this.activeCampoUnico = null;
    this.colaboradores = [];

    // Rellenar dirección del colaborador si no hay PDV seleccionado
    const pdv = this.muebleForm.get('pdv')?.value;
    this.rellenarDireccionColaborador(colaborador);
  }

  selectOtraDireccion(direccion: OtraDireccion) {
    this.muebleForm.patchValue({
      otroDestino: direccion.nombre,
      colaborador: '',
    });

    this.muebleForm.patchValue({
      direccion: direccion.direccion || '',
      poblacion: direccion.poblacion || '',
      provincia: direccion.provincia || '',
      cp: direccion.cp || '',
      telefono: direccion.telefono || '',
    });

    this.otraDireccionSeleccionada = direccion;
    this.activeCampoUnico = null;
    this.otrasDirecciones = [];
  }

  private cargarPDVPerfumeria(perfumeria: string) {
    this.direccionesService
      .getPdvsPerfumeria(perfumeria)
      .subscribe((data: PDV[]) => {
        this.pdvs = data;
      });
  }

  private rellenarDireccionPDV(nombrePDV: string) {
    const pdvSeleccionado = this.pdvs.find((pdv) => pdv.nombre === nombrePDV);
    if (pdvSeleccionado) {
      this.muebleForm.patchValue({
        direccion: pdvSeleccionado.direccion || '',
        poblacion: pdvSeleccionado.poblacion || '',
        provincia: pdvSeleccionado.provincia || '',
        cp: pdvSeleccionado.cp || '',
        telefono: pdvSeleccionado.telefono || '',
      });
    }
  }

  private rellenarDireccionColaborador(colaborador: Colaborador) {
    this.muebleForm.patchValue({
      direccion: colaborador.direccion || '',
      poblacion: colaborador.poblacion || '',
      provincia: colaborador.provincia || '',
      cp: colaborador.cp || '',
      telefono: colaborador.telefono || '',
    });
  }

  private limpiarCamposDireccion() {
  const otroDestino = this.muebleForm.get('otroDestino')?.value;
  const pdv = this.muebleForm.get('pdv')?.value;
  const colaborador = this.muebleForm.get('colaborador')?.value;

  // Solo limpiar si NO hay PDV, NI otro destino, NI colaborador
  if (!otroDestino && !pdv && !colaborador) {
    this.muebleForm.patchValue({
      direccion: '',
      poblacion: '',
      provincia: '',
      cp: '',
      telefono: '',
    });
  }
}

  // Métodos de navegación y estados
  setActiveCampoUnico(campo: string): void {
    this.activeCampoUnico = campo;
  }

  clearActiveCampoUnico(): void {
    setTimeout(() => {
      this.activeCampoUnico = null;
    }, 50);
  }

  onEnterKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    if (event.key === 'Enter') {
      let handled = false;

      if (
        this.activeCampoUnico === 'perfumeria' &&
        this.perfumerias.length > 0 &&
        !this.perfumeriaSeleccionada
      ) {
        event.preventDefault();
        this.selectPerfumeria(this.perfumerias[0]);
        handled = true;
      } else if (
        this.activeCampoUnico === 'pdv' &&
        this.pdvs.length > 0 &&
        !this.pdvSeleccionado
      ) {
        event.preventDefault();
        this.selectPdv(this.pdvs[0]);
        handled = true;
      } else if (
        this.activeCampoUnico === 'colaborador' &&
        this.colaboradores.length > 0 &&
        !this.colaboradorSeleccionado
      ) {
        event.preventDefault();
        this.selectColaborador(this.colaboradores[0]);
        handled = true;
      } else if (
        this.activeCampoUnico === 'otroDestino' &&
        this.otrasDirecciones.length > 0 &&
        !this.otraDireccionSeleccionada
      ) {
        event.preventDefault();
        this.selectOtraDireccion(this.otrasDirecciones[0]);
        handled = true;
      }

      if (handled) {
        setTimeout(() => {
          this.focusNextElement(target);
        }, 100);
        return;
      } else {
        event.preventDefault();
        this.focusNextElement(target);
      }
    }

    if (event.ctrlKey && event.key === '+') {
      event.preventDefault();
      this.agregarProducto();
    }
  }

  private focusNextElement(currentElement: HTMLElement): void {
    const inputs = Array.from(
      document.querySelectorAll<HTMLElement>('input, select, textarea, button')
    );
    const index = inputs.indexOf(currentElement);

    if (index >= 0 && index < inputs.length - 1) {
      const nextElement = inputs[index + 1];

      if (nextElement.classList.contains('add-producto')) {
        this.agregarProducto();
      } else {
        nextElement.focus();
      }
    }
  }

  // Métodos de cálculo
  calcularCosteTotal() {
    const costeColaborador =
      this.muebleForm.get('costeColaborador')?.value || 0;
    const costeEnvio = this.muebleForm.get('costeEnvio')?.value || 0;
    const total = parseFloat(costeColaborador) + parseFloat(costeEnvio);
    this.muebleForm.get('costeTotal')?.setValue(total);
  }

  // Métodos de validación
  esPrevision(): boolean {
    return this.pestanaPadre === 'previsionMueble';
  }

  esDetallePendiente(): boolean {
    return this.pestanaPadre === 'detallePrevisionMueble';
  }

  esDetalleRealizado(): boolean {
    return this.pestanaPadre === 'detalleRealizadoMueble';
  }

  isProductoNuevo(index: number): boolean {
    const ref = this.productosControls.at(index).get('ref')!.value;
    if (ref === 'VISUAL' || ref === 'SIN REFERENCIA') {
      return false;
    }
    return this.productosNuevos.has(index);
  }

  esProductoEspecial(referencia: string): boolean {
    if (referencia == null) return false;
    return 'VISUAL' === referencia || 'SIN REFERENCIA' === referencia;
  }

  esEstadoRequerido(index: number): boolean {
    const refControl = this.productosControls.at(index).get('ref');
    const referencia = refControl?.value;
    return !this.esProductoEspecial(referencia);
  }

  getEstadosDisponibles(index: number): string[] {
    const tipoAccion = this.muebleForm.get('tipoAccion')?.value;

    // Si es RETIRADA y no hay estados específicos, devolver TODOS los estados del sistema
    if (
      tipoAccion === 'RETIRADA' &&
      !this.estadosDisponiblesPorProducto[index]
    ) {
      return this.estados.map((e) => e.nombre!);
    }

    // Para IMPLANTACION e INTERCAMBIO, devolver solo los estados con stock
    return (
      this.estadosDisponiblesPorProducto[index] ||
      this.estados.map((e) => e.nombre!)
    );
  }

  refValidaIndex(i: number): boolean {
    const ref = this.productosControls.at(i).get('ref')!.value;
    return this.refValida(ref);
  }

  refValida(ref: string): boolean {
    const refValida =
      /^[0-9]{7}$/.test(ref) ||
      /^R[0-9]{7}$/.test(ref) ||
      /^[A-Za-z0-9]{10}$/.test(ref) ||
      ref === 'VISUAL' ||
      ref === 'SIN REFERENCIA';
    return refValida;
  }

  descriptionValida(i: number): boolean {
    const description = this.productosControls.at(i).get('description')!.value;
    return description && description.trim().length > 0;
  }

  campoVacio(nombreCampo: string, index: number): boolean {
    const control = this.productosControls.at(index).get(nombreCampo);
    return !control!.valid && control!.touched;
  }

  campoSimpleVacio(nombreCampo: string): boolean {
    const control = this.muebleForm.get(nombreCampo);

    // Si el campo está deshabilitado, no mostrarlo como vacío
    if (control?.disabled) {
      return false;
    }

    return !control!.valid;
  }

  perfumeriaValido(): boolean {
    const perfumeria = this.muebleForm.get('perfumeria')?.value;
    const pdv = this.muebleForm.get('pdv')?.value;

    // Perfumería y PDV deben ir siempre juntos
    if ((pdv && !perfumeria) || (!pdv && perfumeria)) {
      return false;
    }
    return true;
  }

  pdvValido(): boolean {
    const perfumeria = this.muebleForm.get('perfumeria')?.value;
    const pdv = this.muebleForm.get('pdv')?.value;

    // Perfumería y PDV deben ir siempre juntos
    if ((pdv && !perfumeria) || (!pdv && perfumeria)) {
      return false;
    }
    return true;
  }

  colaboradorValido(): boolean {
    const perfumeria = this.muebleForm.get('perfumeria')?.value;
    const pdv = this.muebleForm.get('pdv')?.value;
    const colaborador = this.muebleForm.get('colaborador')?.value;
    const otroDestino = this.muebleForm.get('otroDestino')?.value;

    // Si hay colaborador, puede ir solo O con perfumería+PDV, pero NO con otro destino
    if (colaborador && otroDestino) {
      return false;
    }

    // Si hay colaborador sin perfumería+PDV, no debe haber ninguno de los dos
    if (colaborador && (perfumeria || pdv)) {
      // Verificar que si hay perfumería y PDV, estén ambos
      return perfumeria && pdv;
    }

    return true;
  }

  otroDestinoValido(): boolean {
    const perfumeria = this.muebleForm.get('perfumeria')?.value;
    const pdv = this.muebleForm.get('pdv')?.value;
    const colaborador = this.muebleForm.get('colaborador')?.value;
    const otroDestino = this.muebleForm.get('otroDestino')?.value;

    // Si hay otro destino, puede ir solo O con perfumería+PDV, pero NO con colaborador
    if (otroDestino && colaborador) {
      return false;
    }

    // Si hay otro destino con perfumería+PDV, verificar que estén ambos
    if (otroDestino && (perfumeria || pdv)) {
      return perfumeria && pdv;
    }

    return true;
  }

  previsionEsValidaCampoSimple(): boolean {
    const perfumeria = this.muebleForm.get('perfumeria')?.value;
    const pdv = this.muebleForm.get('pdv')?.value;
    const colaborador = this.muebleForm.get('colaborador')?.value;
    const otroDestino = this.muebleForm.get('otroDestino')?.value;

    // Verificar que perfumería y PDV vayan siempre juntos
    const perfumeriaPdvJuntos = (perfumeria && pdv) || (!perfumeria && !pdv);
    if (!perfumeriaPdvJuntos) {
      return false;
    }

    // Determinar qué campos están completos
    const tienePerfumeriaPdv = perfumeria && pdv;
    const tieneColaborador = colaborador && colaborador.trim() !== '';
    const tieneOtroDestino = otroDestino && otroDestino.trim() !== '';

    // Combinaciones válidas:
    // 1. PDV + PERFUMERIA
    // 2. COLABORADOR solo
    // 3. OTRO DESTINO solo
    // 4. PDV + PERFUMERIA + COLABORADOR
    // 5. PDV + PERFUMERIA + OTRO DESTINO
    const combinacionesValidas = [
      tienePerfumeriaPdv && !tieneColaborador && !tieneOtroDestino, // 1
      !tienePerfumeriaPdv && tieneColaborador && !tieneOtroDestino, // 2
      !tienePerfumeriaPdv && !tieneColaborador && tieneOtroDestino, // 3
      tienePerfumeriaPdv && tieneColaborador && !tieneOtroDestino, // 4
      tienePerfumeriaPdv && !tieneColaborador && tieneOtroDestino, // 5
    ];

    return combinacionesValidas.some((c) => c);
  }

  private productosRetiradaSonValidos(): boolean {
    return this.productosRetiradaControls.controls.every((producto) => {
      const ref = producto.get('ref')?.value;
      const description = producto.get('description')?.value;
      const estado = producto.get('estado')?.value;
      const unidades = producto.get('unidades')?.value;

      const refValida = this.refValida(ref);
      const descriptionValida = description && description.trim().length > 0;
      const estadoValido =
        this.esProductoEspecial(ref) || (estado && estado.trim() !== '');
      const unidadesValidas = unidades > 0;

      return refValida && descriptionValida && estadoValido && unidadesValidas;
    });
  }

  private productosSonValidos(): boolean {
    return this.productosControls.controls.every((producto) => {
      const ref = producto.get('ref')?.value;
      const description = producto.get('description')?.value;
      const estado = producto.get('estado')?.value;
      const unidades = producto.get('unidades')?.value;

      const refValida = this.refValida(ref);
      const descriptionValida = description && description.trim().length > 0;
      const estadoValido =
        this.esProductoEspecial(ref) || (estado && estado.trim() !== '');
      const unidadesValidas = unidades > 0;

      return refValida && descriptionValida && estadoValido && unidadesValidas;
    });
  }

  // Métodos de envío
  onSubmit() {
    this.carga.show();
    this.btnSubmitActivado = false;

    if (this.previsionEsValida()) {
      const nuevoMueble: Mueble = this.construirMueble();

      this.muebleService.newMueble(nuevoMueble).subscribe({
        next: (muebleCreado) => {
          console.log('Trabajo de mueble creado:', muebleCreado);
          this.snackBarExito('Previsión de trabajo creada correctamente.');
          this.resetForm();
          this.carga.hide();
          this.btnSubmitActivado = true;
        },
        error: (error) => {
          console.error('Error al crear el trabajo:', error);
          this.snackBarError(error.error || 'Error al crear el trabajo');
          this.carga.hide();
          this.btnSubmitActivado = true;
        },
      });
    } else {
      this.carga.hide();
      this.btnSubmitActivado = true;
      this.marcarCamposInvalidos();
    }
  }

  modificarMueble() {
    this.carga.show();
    if (this.previsionEsValida()) {
      const muebleActualizado: Mueble = this.construirMueble();
      muebleActualizado.id = this.detallesMueble?.id;
      
      // Mantener el estado original si está en realizados
      if (this.pestanaPadre === 'detalleRealizadoMueble') {
        muebleActualizado.estado = true;
      }

      this.muebleService.updateMueble(muebleActualizado).subscribe({
        next: (updatedMueble) => {
          console.log('Trabajo actualizado:', updatedMueble);
          location.reload();
          this.snackBarExito('Trabajo actualizado exitosamente');
        },
        error: (err) => {
          console.error('Error al actualizar el trabajo:', err);
          this.snackBarError('Error al actualizar el trabajo');
          this.carga.hide();
        },
      });
    } else {
      this.carga.hide();
    }
  }

  // Métodos de utilidad
  private snackBarError(mensaje: string) {
    this.snackBar.open(mensaje, '✖', {
      duration: 3000,
      panelClass: 'error',
    });
  }

  private snackBarExito(mensaje: string) {
    this.snackBar.open(mensaje, '✖', {
      duration: 3000,
      panelClass: 'exito',
    });
  }
}
