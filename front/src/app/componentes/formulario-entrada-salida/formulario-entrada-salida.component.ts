import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormArray, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { Entrada } from 'src/app/models/entrada.model';
import { Salida } from 'src/app/models/salida.model';
import { Perfumeria } from 'src/app/models/perfumeria.model';
import { PDV } from 'src/app/models/pdv.model';
import { Colaborador } from 'src/app/models/colaborador.model';
import { OtraDireccion } from 'src/app/models/otraDireccion.model';
import { AgenciaTransporte } from 'src/app/models/agencia-transporte.model';
import { Estado } from 'src/app/models/estado.model';
import { Producto } from 'src/app/models/producto.model';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { FormularioBuilderService } from './services/formulario-builder.service';
import { FormularioValidationService } from './services/formulario-validation.service';
import { StockManagerService } from '../../services/stock-manager.service';
import { PantallaCargaService } from '../../services/pantalla-carga.service';
import { ImportarExcelService } from '../../services/importar-excel.service';
import { SalidaUbicacionService } from '../../services/salida-ubicacion.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { FormularioFacadeService } from './services/formulario-entrada-salida-facade.service';

@Component({
  selector: 'app-formulario-entrada-salida',
  templateUrl: './formulario-entrada-salida.component.html',
  styleUrls: ['./formulario-entrada-salida.component.css'],
  providers: [
    FormularioBuilderService,
    FormularioValidationService,
    FormularioFacadeService,
    StockManagerService
  ]
})
export class FormularioEntradaSalidaComponent implements OnInit, OnDestroy {
  @Input() pestanaPadre: string = '';
  @Input() detallesES?: Entrada | Salida = undefined;

  // ============================================
  // ESTADO LOCAL DEL COMPONENTE
  // ============================================
  
  entradaSalidaForm!: FormGroup;
  mostrarFormulario = false;
  btnSubmitActivado = true;
  pendiente = true;
  enDetalles = false;
  
  // UI State
  activeRowIndex: number | null = null;
  activeCampoUnico: string | null = null;
  productosNuevos = new Set<number>();
  private isTabbing = false;

  // Datos cargados
  perfumerias: Perfumeria[] = [];
  pdvs: PDV[] = [];
  colaboradores: Colaborador[] = [];
  otrasDirecciones: OtraDireccion[] = [];
  agenciasTransporte: AgenciaTransporte[] = [];
  estados: Estado[] = [];
  ubicaciones: string[] = [];
  visuales: Producto[] = [];
  productosSR: Producto[] = [];

  // Selecciones actuales
  perfumeriaSeleccionada: Perfumeria | null = null;
  pdvSeleccionado: PDV | null = null;
  colaboradorSeleccionado: Colaborador | null = null;
  otraDireccionSeleccionada: OtraDireccion | null = null;

  // Paginación
  pageSize = 10;
  pageIndex = 0;

  // Path actual
  currentPath: string = window.location.pathname;

  // ID de salida actual (para stock)
  private salidaActualId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    public formBuilder: FormularioBuilderService,
    public validationService: FormularioValidationService,
    private facadeService: FormularioFacadeService,
    public stockManager: StockManagerService,
    private carga: PantallaCargaService,
    private importarES: ImportarExcelService,
    private salidaUbicacionService: SalidaUbicacionService,
    private ubicacionService: UbicacionService,
    private cdr: ChangeDetectorRef
  ) {}

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarDatosIniciales();
    this.configurarObservables();
    
    if (!this.detallesES) {
      this.inicializarNuevoFormulario();
    } else {
      this.inicializarDetalleFormulario();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stockManager.limpiarCache();
    this.importarES.resetExcel();
    
    if (this.esSalida()) {
      this.salidaActualId = null;
    }
  }

  // ============================================
  // INICIALIZACIÓN
  // ============================================

  private inicializarFormulario(): void {
    this.entradaSalidaForm = this.formBuilder.createForm();
  }

  private cargarDatosIniciales(): void {
    this.facadeService.cargarDatosIniciales(this.esEntrada(), this.esSalida())
      .subscribe({
        next: (datos) => {
          this.estados = datos.estados;
          if (datos.agencias) {
            this.agenciasTransporte = datos.agencias;
          }
        },
        error: (error) => {
          console.error('Error al cargar datos iniciales:', error);
        }
      });

    if (this.esEntrada()) {
      this.cargarUbicaciones();
    }

    this.cargarColaboradores();
    this.cargarPerfumerias('a');
    this.cargarTodasOtrasDirecciones();
  }

  private inicializarNuevoFormulario(): void {
    if (this.pestanaPadre === 'nuevaEntrada' || this.pestanaPadre === 'nuevaSalida') {
      // NUEVA ENTRADA/SALIDA
      this.pendiente = false;
      this.mostrarFormulario = true;
      this.entradaSalidaForm.patchValue({
        fechaRecepcionEnvio: this.facadeService.formatearFecha(new Date())
      });
    } else if (this.pestanaPadre === 'previsionEntrada' || this.pestanaPadre === 'previsionSalida') {
      // PREVISIÓN (importar desde Excel)
      this.pendiente = true;
      this.mostrarFormulario = true; // ⬅️ Mostrar siempre el formulario
      
      this.importarES.excelData$.subscribe((excelData) => {
        if (excelData?.length) {
          this.resetForm();
          this.actualizarCamposUnicos(excelData[0]);
          this.actualizarProductos(excelData);
          this.carga.hide();
        }
        // No ocultar el formulario si no hay datos
      });
    }
  
    // Suscribirse a productos de salida si es necesario
    if (this.esSalida()) {
      this.salidaUbicacionService.productos$.subscribe((productos) => {
        if (productos.length > 0) {
          this.actualizarProductos(productos);
        }
      });
    }
  }

  private inicializarDetalleFormulario(): void {
    this.mostrarFormulario = true;
    this.enDetalles = true;
    this.actualizarCamposUnicos(this.detallesES);
    this.actualizarProductos(this.detallesES!.productos!);
    this.validationService.marcarCamposInvalidos(this.entradaSalidaForm);

    if (this.esSalida()) {
      this.salidaActualId = this.detallesES?.id || null;
      this.cargarDatosParaDetalleSalida();
    }
  }

  // ============================================
  // CONFIGURACIÓN DE OBSERVABLES
  // ============================================

  private configurarObservables(): void {
    // Observable para Otras Direcciones
    this.entradaSalidaForm
      .get('otroOrigenDestino')
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        if (!value) {
          this.limpiarCamposDireccion();
          this.otraDireccionSeleccionada = null;
          this.cargarTodasOtrasDirecciones();
        } else {
          this.cargarOtrasDirecciones(value);
        }
      });

    // Observable para Perfumería
    let nombrePerfumeria = '';
    this.entradaSalidaForm
      .get('perfumeria')
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        nombrePerfumeria = value;
        if (!value) {
          this.limpiarCamposDireccion();
          this.entradaSalidaForm.get('pdv')?.setValue('');
          this.pdvs = [];
          this.perfumeriaSeleccionada = null;
          this.pdvSeleccionado = null;
          this.cargarPerfumerias('a');
        } else {
          this.cargarPerfumerias(value);
        }
      });

    // Observable para Colaborador
    this.entradaSalidaForm
      .get('colaborador')
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        if (!value) {
          this.limpiarCamposDireccion();
          this.colaboradorSeleccionado = null;
          if (!nombrePerfumeria) {
            this.cargarColaboradores();
          }
        } else {
          this.cargarColaboradoresPorNombre(value);
        }
      });

    // Observable para PDV (si no hay colaborador)
    this.entradaSalidaForm
      .get('pdv')
      ?.valueChanges.pipe(
        debounceTime(300) // Añadir un delay de 300ms entre la pulsación de tecla y la búsqueda
      )
      .subscribe((value) => {
        if (value == '' || value == null) {
            // Solo limpiar colaborador si estaba asociado al PDV anterior
          if (this.pdvSeleccionado?.colaborador) {
            this.entradaSalidaForm.get('colaborador')!.setValue('');
            this.colaboradorSeleccionado = null;
          }
          this.limpiarCamposDireccion();
          // this.perfumerias = [];
          this.pdvSeleccionado = null;
          if (nombrePerfumeria) {
            this.cargarPDVs();
          }
        } else {
          this.cargarPDVsPerfumeriaByNombre(nombrePerfumeria, value);
        }
      });

    // Observables para campos de dirección en salidas
    if (this.esSalida()) {
      this.configurarObservablesDireccionSalida();
    }
  }

  private configurarObservablesDireccionSalida(): void {
    this.entradaSalidaForm.get('pdv')?.valueChanges.subscribe((value) => {
      if (value && this.hay('pdv') && !this.hay('colaborador')) {
        this.rellenarDireccionPDV(value);
      } else if (!value) {
        this.limpiarCamposDireccion();
      }
    });

    this.entradaSalidaForm.get('colaborador')?.valueChanges.subscribe((value) => {
      if (value) {
        this.rellenarDireccionColaborador(value);
      } else if (!this.hay('pdv')) {
        this.limpiarCamposDireccion();
      }
    });
  }

  // ============================================
  // GETTERS
  // ============================================

  get productosControls(): FormArray {
    return this.formBuilder.getProductosArray(this.entradaSalidaForm);
  }

  // ============================================
  // MÉTODOS DE CARGA DE DATOS
  // ============================================

  private cargarUbicaciones(): void {
    this.ubicacionService.getUbicacionesOrderByNombre().subscribe({
      next: (ubicaciones: Ubicacion[]) => {
        this.ubicaciones = ubicaciones.map(ubi => ubi.nombre!);
      },
      error: (error) => {
        console.error('Error al cargar ubicaciones:', error);
      }
    });
  }

  private cargarPerfumerias(nombre: string): void {
    this.facadeService.cargarPerfumerias(nombre, this.pageIndex, this.pageSize)
      .subscribe({
        next: (perfumerias) => {
          this.perfumerias = perfumerias;
        },
        error: (error) => {
          console.error('Error al cargar perfumerías:', error);
        }
      });
  }

  private cargarPDVs(): void {
    const perfumeria = this.entradaSalidaForm.get('perfumeria')?.value;
    if (perfumeria) {
      this.facadeService.cargarPDVsPerfumeria(perfumeria)
        .subscribe({
          next: (pdvs) => {
            this.pdvs = pdvs;
          },
          error: (error) => {
            console.error('Error al cargar PDVs:', error);
          }
        });
    }
  }

  private cargarPDVsPerfumeriaByNombre(nombrePerfumeria: string, nombrePdv: string): void {
    this.facadeService.cargarPDVsPerfumeriaByNombre(nombrePerfumeria, nombrePdv)
      .subscribe({
        next: (pdvs) => {
          this.pdvs = pdvs;
        },
        error: (error) => {
          console.error('Error al cargar PDVs:', error);
        }
      });
  }

  private cargarColaboradores(): void {
    this.facadeService.cargarColaboradores()
      .subscribe({
        next: (colaboradores) => {
          this.colaboradores = colaboradores;
        },
        error: (error) => {
          console.error('Error al cargar colaboradores:', error);
        }
      });
  }

  private cargarColaboradoresPorNombre(nombre: string): void {
    this.facadeService.cargarColaboradoresPorNombre(nombre, this.pageIndex, this.pageSize)
      .subscribe({
        next: (colaboradores) => {
          this.colaboradores = colaboradores;
        },
        error: (error) => {
          console.error('Error al cargar colaboradores:', error);
        }
      });
  }

  private cargarTodasOtrasDirecciones(): void {
    this.facadeService.cargarOtrasDirecciones()
      .subscribe({
        next: (direcciones) => {
          this.otrasDirecciones = direcciones;
        },
        error: (error) => {
          console.error('Error al cargar otras direcciones:', error);
        }
      });
  }

  private cargarOtrasDirecciones(nombre: string): void {
    this.facadeService.cargarOtrasDireccionesPorNombre(nombre, this.pageIndex, this.pageSize)
      .subscribe({
        next: (direcciones) => {
          this.otrasDirecciones = direcciones;
        },
        error: (error) => {
          console.error('Error al cargar otras direcciones:', error);
        }
      });
  }

  // ============================================
  // MANEJO DE PRODUCTOS
  // ============================================

  agregarProducto(): void {
    this.formBuilder.agregarProducto(this.entradaSalidaForm);

    setTimeout(() => {
      const inputsRef = Array.from(
        document.querySelectorAll<HTMLElement>('input[formControlName="ref"]')
      );
      if (inputsRef.length > 0) {
        inputsRef[inputsRef.length - 1].focus();
      }
    });
  }

  eliminarProducto(index: number): void {
    // Deshacer división si existe
    this.stockManager.actualizarIndicesDivision(index);
    
    // Eliminar del formulario
    this.formBuilder.eliminarProducto(this.entradaSalidaForm, index);

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

  buscarProductoPorReferencia(index: number): void {
    const producto = this.productosControls.at(index);
    const refControl = producto.get('ref');
    const ref = refControl?.value;

    if (ref === 'VISUAL' && this.esSalida()) {
      this.manejarProductoEspecial(index, 'VISUAL');
    } else if (ref === 'SIN REFERENCIA' && this.esSalida()) {
      this.manejarProductoEspecial(index, 'SIN REFERENCIA');
    } else if (ref) {
      refControl!.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((r) => {
            if (r?.trim()) {
              return this.facadeService.buscarProductoPorReferencia(r.trim());
            }
            return of(null);
          })
        )
        .subscribe({
          next: (response) => {
            this.procesarRespuestaProducto(response, index);
          },
          error: () => {
            this.productosNuevos.add(index);
            this.limpiarCamposProducto(index);
          }
        });
    }
  }

  private manejarProductoEspecial(index: number, tipo: 'VISUAL' | 'SIN REFERENCIA'): void {
    const producto = this.productosControls.at(index);
    const estadoControl = producto.get('estado');
    const descriptionControl = producto.get('description');

    // Limpiar validadores de estado para productos especiales
    estadoControl?.clearValidators();
    estadoControl?.updateValueAndValidity();
    this.stockManager.clearEstadosDisponibles(index);

    if (this.esSalida()) {
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
          this.cargarProductosSinReferenciaPorDescripcion(descriptionControl.value);
        }
      }
    }
  }

  private procesarRespuestaProducto(response: any, index: number): void {
    const producto = this.productosControls.at(index);
    const descriptionControl = producto.get('description');
    const estadoControl = producto.get('estado');

    if (response && response.estados && response.estados.length > 0) {
      descriptionControl?.setValue(response.description);
      this.productosNuevos.delete(index);

      // Filtrar solo estados con stock > 0
      const estadosConStock = response.estados.filter((e: any) => e.stock > 0);

      if (estadosConStock.length === 0) {
        this.productosNuevos.add(index);
        this.limpiarCamposProducto(index);
        this.validationService.mostrarError(
          `El producto ${response.referencia} no tiene stock disponible`
        );
        return;
      }

      // Guardar estados disponibles
      this.stockManager.setEstadosDisponibles(
        index,
        estadosConStock.map((e: any) => e.estado)
      );

      // Hacer estado obligatorio
      estadoControl?.setValidators([Validators.required]);
      estadoControl?.updateValueAndValidity();

      if (estadosConStock.length === 1) {
        // Auto-seleccionar si solo hay un estado
        const unicoEstado = estadosConStock[0];
        estadoControl?.setValue(unicoEstado.estado);

        if (this.esSalida()) {
          this.cargarUbicacionesYStock(response.referencia, unicoEstado.estado, index);
        }
      } else if (estadoControl?.value && this.esSalida()) {
        // Si ya hay estado seleccionado, cargar ubicaciones
        this.cargarUbicacionesYStock(response.referencia, estadoControl.value, index);
      }
    } else {
      this.productosNuevos.add(index);
      this.limpiarCamposProducto(index);
    }
  }

  private cargarUbicacionesYStock(referencia: string, estado: string, index: number): void {
    this.stockManager.cargarUbicacionesPorReferenciaYEstado(referencia, estado, index)
      .subscribe({
        next: () => {
          const producto = this.productosControls.at(index);
          const ubicacion = producto.get('ubicacion')?.value;
          
          if (ubicacion) {
            this.validarStockEspecifico(index);
          }
        },
        error: (error) => {
          console.error('Error al cargar ubicaciones:', error);
        }
      });
  }

  private limpiarCamposProducto(index: number): void {
    const producto = this.productosControls.at(index);
    
    producto.patchValue({
      description: '',
      estado: null,
      ubicacion: '',
      unidades: ''
    });

    this.stockManager.clearEstadosDisponibles(index);
    this.stockManager.limpiarStockProducto(index, producto.get('ref')?.value);
  }

  // ============================================
  // EVENTOS DE CAMBIO
  // ============================================

  onEstadoChange(index: number): void {
    const producto = this.productosControls.at(index);
    const referencia = producto.get('ref')?.value;
    const estado = producto.get('estado')?.value;

    if (referencia && estado && this.esSalida()) {
      this.cargarUbicacionesYStock(referencia, estado, index);
    }

    // División automática si el estado cambió
    if (producto.get('estado')?.dirty) {
      setTimeout(() => {
        this.dividirUnidadesAutomaticamente(index);
      }, 100);
    }
  }

  onUbicacionChange(index: number): void {
    if (this.esSalida()) {
      this.validarStockEspecifico(index);
      this.stockManager.actualizarValidadoresUnidades(
        this.productosControls,
        index,
        this.validationService.esProductoEspecial.bind(this.validationService)
      );
    }
  }

  onUnidadesBlur(index: number): void {
    this.dividirUnidadesAutomaticamente(index);
  }

  private dividirUnidadesAutomaticamente(index: number): void {
    this.stockManager.dividirUnidadesAutomaticamente(
      this.productosControls,
      index,
      this.validationService.esProductoEspecial.bind(this.validationService),
      this.validationService.mostrarExito.bind(this.validationService)
    );
  }

  private validarStockEspecifico(index: number): void {
    const producto = this.productosControls.at(index);
    const referencia = producto.get('ref')?.value;
    const estado = producto.get('estado')?.value;
    const ubicacion = producto.get('ubicacion')?.value;

    if (!referencia || !estado || !ubicacion) return;

    this.stockManager.validarStockEspecifico(
      index,
      referencia,
      estado,
      ubicacion,
      this.currentPath,
      this.salidaActualId,
      this.validationService.esProductoEspecial.bind(this.validationService)
    ).subscribe({
      next: () => {
        this.stockManager.actualizarValidadoresUnidades(
          this.productosControls,
          index,
          this.validationService.esProductoEspecial.bind(this.validationService)
        );
      },
      error: (error) => {
        console.error('Error al validar stock:', error);
      }
    });
  }

  // ============================================
  // SINCRONIZACIÓN
  // ============================================

  sincronizarUbicaciones(index: number): void {
    if (index === 0) {
      const ubicacion = this.productosControls.at(0).get('ubicacion')?.value;
      this.productosControls.controls.forEach((producto) => {
        producto.get('ubicacion')?.setValue(ubicacion);
      });
    }
  }

  sincronizarFormasEnvio(index: number): void {
    if (index === 0) {
      const formaEnvio = this.productosControls.at(0).get('formaEnvio')?.value;
      this.productosControls.controls.forEach((producto) => {
        producto.get('formaEnvio')?.setValue(formaEnvio);
      });
    }
  }

  // ============================================
  // SUBMIT
  // ============================================

  onSubmit(): void {
    this.carga.show();
    this.btnSubmitActivado = false;

    const validacion = this.validationService.validarFormularioCompleto(
      this.entradaSalidaForm,
      this.esEntrada(),
      this.esSalida(),
      this.pendiente
    );

    if (!validacion.valido) {
      this.validationService.marcarCamposInvalidos(this.entradaSalidaForm);
      this.validationService.mostrarError(validacion.mensaje || 'Formulario inválido');
      this.carga.hide();
      this.btnSubmitActivado = true;
      return;
    }

    if (this.esEntrada()) {
      this.guardarEntrada();
    } else if (this.esSalida()) {
      this.guardarSalida();
    }
  }

  private guardarEntrada(): void {
    const entrada = this.facadeService.construirEntrada(this.entradaSalidaForm, this.pendiente);

    this.facadeService.guardarEntrada(entrada).subscribe({
      next: () => {
        this.validationService.mostrarExito('Entrada guardada correctamente');
        this.resetForm();
        this.otraEntradaSalida();
        this.entradaSalidaForm.patchValue({
          fechaRecepcionEnvio: this.facadeService.formatearFecha(new Date())
        });
        this.carga.hide();
        this.btnSubmitActivado = true;
      },
      error: (error) => {
        this.validationService.mostrarError(error.error || 'Error al guardar entrada');
        this.carga.hide();
        this.btnSubmitActivado = true;
      }
    });
  }

  private guardarSalida(): void {
    const salida = this.facadeService.construirSalida(this.entradaSalidaForm, this.pendiente);

    this.facadeService.guardarSalida(salida).subscribe({
      next: () => {
        this.validationService.mostrarExito('Salida guardada correctamente');
        this.resetForm();
        this.otraEntradaSalida();
        this.entradaSalidaForm.patchValue({
          fechaRecepcionEnvio: this.facadeService.formatearFecha(new Date())
        });
        this.carga.hide();
        this.btnSubmitActivado = true;
      },
      error: (error) => {
        this.validationService.mostrarError(error.error || 'Error al guardar salida');
        this.carga.hide();
        this.btnSubmitActivado = true;
      }
    });
  }

  modificarEntrada(): void {
    this.carga.show();

    const entrada = this.facadeService.construirEntrada(this.entradaSalidaForm, this.pendiente);
    entrada.id = this.detallesES?.id;

    this.facadeService.actualizarEntrada(entrada).subscribe({
      next: () => {
        this.validationService.mostrarExito('Entrada actualizada correctamente');
        location.reload();
      },
      error: (error) => {
        this.validationService.mostrarError(error.error || 'Error al actualizar entrada');
        this.carga.hide();
      }
    });
  }

  modificarSalida(): void {
    this.carga.show();

    const salida = this.facadeService.construirSalida(this.entradaSalidaForm, this.pendiente);
    salida.id = this.detallesES?.id;

    this.facadeService.actualizarSalida(salida).subscribe({
      next: () => {
        this.validationService.mostrarExito('Salida actualizada correctamente');
        location.reload();
      },
      error: (error) => {
        this.validationService.mostrarError(error.error || 'Error al actualizar salida');
        this.carga.hide();
      }
    });
  }

  // ============================================
  // NAVEGACIÓN CON TECLADO
  // ============================================

  onEnterKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    if (event.key === 'Tab') {
      this.isTabbing = true;
      return;
    }

    if (event.key === 'Enter') {
      let handled = false;

      // Verificar si estamos en un autocomplete
      if (this.activeCampoUnico === 'perfumeria' && this.perfumerias.length > 0 && !this.perfumeriaSeleccionada) {
        event.preventDefault();
        this.selectPerfumeria(this.perfumerias[0]);
        handled = true;
      } else if (this.activeCampoUnico === 'pdv' && this.pdvs.length > 0 && !this.pdvSeleccionado) {
        event.preventDefault();
        this.selectPdv(this.pdvs[0]);
        handled = true;
      } else if (this.activeCampoUnico === 'colaborador' && this.colaboradores.length > 0 && !this.colaboradorSeleccionado) {
        event.preventDefault();
        this.selectColaborador(this.colaboradores[0]);
        handled = true;
      } else if (this.activeCampoUnico === 'otroOrigenDestino' && this.otrasDirecciones.length > 0 && !this.otraDireccionSeleccionada) {
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

  // ============================================
  // SELECCIÓN DE VALORES (AUTOCOMPLETE)
  // ============================================

  selectPerfumeria(perfumeria: Perfumeria): void {
    this.entradaSalidaForm.patchValue({
      perfumeria: perfumeria.nombre,
      otroOrigenDestino: '',
      colaborador: ''
    });

    this.perfumeriaSeleccionada = perfumeria;
    this.cargarPDVs();
    this.activeCampoUnico = null;
    this.perfumerias = [];
  }

  selectPdv(pdv: PDV): void {
    this.entradaSalidaForm.patchValue({
      pdv: pdv.nombre,
      otroOrigenDestino: '',
      colaborador: ''
    });

    this.pdvSeleccionado = pdv;
    this.activeCampoUnico = null;
    this.pdvs = [];
  }

  selectColaborador(colaborador: Colaborador): void {
    this.entradaSalidaForm.patchValue({
      colaborador: colaborador.nombre,
      otroOrigenDestino: ''
    });

    this.colaboradorSeleccionado = colaborador;
    this.activeCampoUnico = null;
    this.colaboradores = [];
  }

  selectOtraDireccion(direccion: OtraDireccion): void {
    this.entradaSalidaForm.patchValue({
      otroOrigenDestino: direccion.nombre,
      colaborador: ''
    });

    if (this.esSalida()) {
      this.entradaSalidaForm.patchValue({
        direccion: direccion.direccion || '',
        poblacion: direccion.poblacion || '',
        provincia: direccion.provincia || '',
        cp: direccion.cp || '',
        telefono: direccion.telefono || ''
      });
    }

    this.otraDireccionSeleccionada = direccion;
    this.activeCampoUnico = null;
    this.otrasDirecciones = [];
  }

  selectVisual(index: number, visual: Producto): void {
    const producto = this.productosControls.at(index);
    producto.patchValue({
      description: visual.description,
      unidades: visual.stock
    });

    this.stockManager.cargarUbicacionesProductoEspecial(
      visual.referencia as string,
      visual.description as string
    ).subscribe();

    this.visuales = [];
  }

  selectProductosSR(index: number, sinReferencia: Producto): void {
    const producto = this.productosControls.at(index);
    producto.patchValue({
      description: sinReferencia.description
    });

    this.stockManager.cargarUbicacionesProductoEspecial(
      sinReferencia.referencia as string,
      sinReferencia.description as string
    ).subscribe();

    this.productosSR = [];
  }

  // ============================================
  // MANEJO DE DIRECCIONES
  // ============================================

  private rellenarDireccionPDV(nombrePDV: string): void {
    const pdvSeleccionado = this.pdvs.find((pdv) => pdv.nombre === nombrePDV);
    if (pdvSeleccionado) {
      this.entradaSalidaForm.patchValue({
        direccion: pdvSeleccionado.direccion || '',
        poblacion: pdvSeleccionado.poblacion || '',
        provincia: pdvSeleccionado.provincia || '',
        cp: pdvSeleccionado.cp || '',
        telefono: pdvSeleccionado.telefono || ''
      });

      if (pdvSeleccionado.colaborador) {
        this.cargarColaboradoresPorNombre(pdvSeleccionado.colaborador.nombre!);
      }
    }
  }

  private rellenarDireccionColaborador(nombreColaborador: string): void {
    const colaboradorSeleccionado = this.colaboradores.find(
      (col) => col.nombre === nombreColaborador
    );
    if (colaboradorSeleccionado) {
      this.entradaSalidaForm.patchValue({
        direccion: colaboradorSeleccionado.direccion || '',
        poblacion: colaboradorSeleccionado.poblacion || '',
        provincia: colaboradorSeleccionado.provincia || '',
        cp: colaboradorSeleccionado.cp || '',
        telefono: colaboradorSeleccionado.telefono || ''
      });
    }
  }

  private limpiarCamposDireccion(): void {
    const otroOrigen = this.entradaSalidaForm.get('otroOrigenDestino')?.value;
    const pdv = this.entradaSalidaForm.get('pdv')?.value;
    const colaborador = this.entradaSalidaForm.get('colaborador')?.value;

    if (!otroOrigen && !pdv && !colaborador) {
      this.entradaSalidaForm.patchValue({
        direccion: '',
        poblacion: '',
        provincia: '',
        cp: '',
        telefono: ''
      });
    }
  }

  // ============================================
  // VISUALES Y PRODUCTOS SIN REFERENCIA
  // ============================================

  buscarProductoEspecial(index: number): void {
    if (!this.esSalida()) return;

    const producto = this.productosControls.at(index);
    const ref = producto.get('ref')?.value;
    const description = producto.get('description')?.value;

    if (ref === 'VISUAL') {
      if (!description) {
        this.cargarVisuales();
      } else {
        this.cargarVisualesPorDescripcion(description);
      }
    } else if (ref === 'SIN REFERENCIA') {
      if (!description) {
        this.cargarProductosSinReferencia();
      } else {
        this.cargarProductosSinReferenciaPorDescripcion(description);
      }
    }
  }

  private cargarVisuales(): void {
    this.facadeService.cargarVisuales(this.pageIndex, this.pageSize)
      .subscribe({
        next: (visuales) => {
          this.visuales = visuales;
        },
        error: (error) => {
          console.error('Error al cargar visuales:', error);
        }
      });
  }

  private cargarVisualesPorDescripcion(descripcion: string): void {
    this.facadeService.cargarVisualesPorDescripcion(descripcion, this.pageIndex, this.pageSize)
      .subscribe({
        next: (visuales) => {
          this.visuales = visuales;
        },
        error: (error) => {
          console.error('Error al cargar visuales:', error);
        }
      });
  }

  private cargarProductosSinReferencia(): void {
    this.facadeService.cargarProductosSinReferencia(this.pageIndex, this.pageSize)
      .subscribe({
        next: (productos) => {
          this.productosSR = productos;
        },
        error: (error) => {
          console.error('Error al cargar productos sin referencia:', error);
        }
      });
  }

  private cargarProductosSinReferenciaPorDescripcion(descripcion: string): void {
    this.facadeService.cargarProductosSinReferenciaPorDescripcion(
      descripcion,
      this.pageIndex,
      this.pageSize
    ).subscribe({
      next: (productos) => {
        this.productosSR = productos;
      },
      error: (error) => {
        console.error('Error al cargar productos sin referencia:', error);
      }
    });
  }

  // ============================================
  // ACTUALIZACIÓN DE FORMULARIO
  // ============================================

  private actualizarCamposUnicos(datos: any): void {
    if (!datos) return;

    if ('origen' in datos) {
      // Es entrada
      this.entradaSalidaForm.patchValue({
        fechaRecepcionEnvio: this.facadeService.formatearFecha(datos.fechaRecepcion),
        perfumeria: datos.perfumeria || '',
        pdv: datos.pdv || '',
        colaborador: datos.colaborador || '',
        otroOrigenDestino: datos.origen || '',
        dcs: datos.dcs || ''
      });

      if (datos.perfumeria) {
        this.cargarPDVs();
      }
    } else if ('destino' in datos) {
      // Es salida
      this.entradaSalidaForm.patchValue({
        fechaRecepcionEnvio: this.facadeService.formatearFecha(datos.fechaEnvio),
        perfumeria: datos.perfumeria || '',
        pdv: datos.pdv || '',
        colaborador: datos.colaborador || '',
        otroOrigenDestino: datos.destino || '',
        direccion: datos.direccion || '',
        poblacion: datos.poblacion || '',
        provincia: datos.provincia || '',
        cp: datos.cp || '',
        telefono: datos.telefono || ''
      });

      if (datos.perfumeria) {
        this.cargarPDVs();
      }

      if (datos.id) {
        this.salidaActualId = datos.id;
      }
    }
  }

  private actualizarProductos(productos: any[]): void {
    // Limpiar productos existentes
    while (this.productosControls.length) {
      this.productosControls.removeAt(0);
    }

    // Agregar nuevos productos
    productos.forEach((prod) => {
      const productoGroup = this.formBuilder.createProductoGroup();

      const valores = {
        ref: prod.referencia || prod.ref,
        description: prod.descripcion || prod.description,
        unidades: prod.unidades || prod.unidadesPedidas,
        unidadesPedidas: prod.unidadesPedidas || prod.unidades,
        ubicacion: prod.ubicacion,
        palets: prod.palets || 0,
        bultos: prod.bultos || 0,
        formaEnvio: prod.formaEnvio,
        observaciones: prod.observaciones,
        comprobado: prod.comprobado || false,
        estado: prod.estado || null,
        productoId: prod.id || prod.productoId
      };

      productoGroup.patchValue(valores);

      // Solo buscar descripción si no está presente
      if (valores.ref && !valores.description) {
        this.facadeService.buscarProductoPorReferencia(valores.ref).subscribe({
          next: (response) => {
            if (response) {
              productoGroup.get('description')?.setValue(response.description);
            }
          }
        });
      }

      this.productosControls.push(productoGroup);
    });

    this.cdr.detectChanges();
  }

  private cargarDatosParaDetalleSalida(): void {
    // Cargar ubicaciones y validar stock para cada producto
    const promesas: Observable<void>[] = [];

    this.productosControls.controls.forEach((control, index) => {
      const ref = control.get('ref')?.value;
      const estado = control.get('estado')?.value;
      const descripcion = control.get('description')?.value;

      if (ref && !this.validationService.esProductoEspecial(ref)) {
        // Para productos normales
        if (estado) {
          const promesa = this.stockManager
            .cargarUbicacionesPorReferenciaYEstado(ref, estado, index)
            .pipe(
              switchMap(() => {
                const ubicacion = control.get('ubicacion')?.value;
                if (ubicacion) {
                  return this.stockManager.validarStockEspecifico(
                    index,
                    ref,
                    estado,
                    ubicacion,
                    this.currentPath,
                    this.salidaActualId,
                    this.validationService.esProductoEspecial.bind(this.validationService)
                  );
                }
                return of(void 0);
              })
            );
          promesas.push(promesa);
        }
      } else if (this.validationService.esProductoEspecial(ref) && descripcion) {
        // Para productos especiales
        const promesa = this.stockManager
          .cargarUbicacionesProductoEspecial(ref, descripcion)
          .pipe(map(() => void 0));
        promesas.push(promesa);
      }
    });

    // Esperar a que todas las cargas terminen
    forkJoin(promesas.length > 0 ? promesas : [of(void 0)]).subscribe({
      next: () => {
        // Forzar actualización de controles
        setTimeout(() => {
          this.productosControls.controls.forEach((control, index) => {
            const ubicacionControl = control.get('ubicacion');
            const ubicacionGuardada = ubicacionControl?.value;

            if (ubicacionGuardada) {
              ubicacionControl?.setValue(ubicacionGuardada);
              ubicacionControl?.updateValueAndValidity();
            }

            if (this.esSalida()) {
              this.stockManager.actualizarValidadoresUnidades(
                this.productosControls,
                index,
                this.validationService.esProductoEspecial.bind(this.validationService)
              );
            }
          });

          this.cdr.detectChanges();
        }, 100);
      },
      error: (error) => {
        console.error('Error al cargar datos de detalle:', error);
      }
    });
  }

  // ============================================
  // GESTIÓN DE ESTADO ACTIVO
  // ============================================

  setActiveRow(index: number): void {
    this.activeRowIndex = index;
  }

  clearActiveRow(): void {
    setTimeout(() => {
      this.activeRowIndex = null;
    }, 200);
  }

  setActiveCampoUnico(campo: string): void {
    this.activeCampoUnico = campo;
    if (this.isTabbing) {
      setTimeout(() => {
        this.loadOptionsForActiveField();
        this.isTabbing = false;
      }, 200);
    }
  }

  clearActiveCampoUnico(): void {
    setTimeout(() => {
      this.activeCampoUnico = null;
    }, 50);
  }

  private loadOptionsForActiveField(): void {
    if (!this.activeCampoUnico) return;

    const valorActual = this.entradaSalidaForm.get(this.activeCampoUnico)?.value;
    if (!valorActual || valorActual.trim() === '') return;

    switch (this.activeCampoUnico) {
      case 'perfumeria':
        if (!this.perfumeriaSeleccionada) {
          this.cargarPerfumerias(valorActual);
        }
        break;
      case 'pdv':
        if (!this.pdvSeleccionado) {
          const perfumeria = this.entradaSalidaForm.get('perfumeria')?.value;
          if (perfumeria) {
            this.cargarPDVsPerfumeriaByNombre(perfumeria, valorActual);
          }
        }
        break;
      case 'colaborador':
        if (!this.colaboradorSeleccionado) {
          this.cargarColaboradoresPorNombre(valorActual);
        }
        break;
      case 'otroOrigenDestino':
        if (!this.otraDireccionSeleccionada) {
          this.cargarOtrasDirecciones(valorActual);
        }
        break;
    }
  }

  // ============================================
  // UTILIDADES Y HELPERS
  // ============================================

  resetForm(): void {
    this.entradaSalidaForm.reset();
    this.entradaSalidaForm = this.formBuilder.createForm();
    this.productosNuevos.clear();
    this.stockManager.limpiarCache();
  }

  otraEntradaSalida(): void {
    this.inicializarFormulario();
    this.cargarDatosIniciales();
    this.configurarObservables();
    
    if (!this.detallesES) {
      this.inicializarNuevoFormulario();
    } else {
      this.inicializarDetalleFormulario();
    }
  }

  hay(campo: string): boolean {
    const valor = this.entradaSalidaForm.get(campo)?.value;
    return valor != null && valor !== '';
  }

  esEntrada(): boolean {
    return this.currentPath.startsWith('/entradas');
  }

  esSalida(): boolean {
    return this.currentPath.startsWith('/salidas');
  }

  isProductoNuevo(index: number): boolean {
    const ref = this.productosControls.at(index).get('ref')?.value;
    if (ref === 'VISUAL' || ref === 'SIN REFERENCIA') {
      return false;
    }
    return this.productosNuevos.has(index);
  }

  campoVacio(nombreCampo: string, index: number): boolean {
    const control = this.productosControls.at(index).get(nombreCampo);
    return !control?.valid && control?.touched || false;
  }

  campoSimpleVacio(nombreCampo: string): boolean {
    const control = this.entradaSalidaForm.get(nombreCampo);
    return !control?.valid && control?.touched || false;
  }

  refValidaIndex(index: number): boolean {
    const ref = this.productosControls.at(index).get('ref')?.value;
    return this.validationService.refValida(ref);
  }

  descriptionValida(index: number): boolean {
    const description = this.productosControls.at(index).get('description')?.value;
    return description && description.trim().length > 0;
  }

  // ============================================
  // MÉTODOS DE VALIDACIÓN PARA EL TEMPLATE
  // ============================================
  
  /**
   * Valida si perfumería y PDV están correctamente rellenados
   */
  perfumeriaValido(): boolean {
    const perfumeria = this.entradaSalidaForm.get('perfumeria')?.value;
    const pdv = this.entradaSalidaForm.get('pdv')?.value;
  
    // Ambos vacíos o ambos llenos es válido
    return (!perfumeria && !pdv) || (perfumeria && pdv);
  }
  
  /**
   * Valida si PDV está correctamente rellenado (junto con perfumería)
   */
  pdvValido(): boolean {
    return this.perfumeriaValido(); // La misma lógica
  }
  
  /**
   * Valida si el colaborador está correctamente rellenado
   */
  colaboradorValido(): boolean {
    const colaborador = this.entradaSalidaForm.get('colaborador')?.value;
    return !!colaborador && colaborador.trim() !== '';
  }
  
  /**
   * Valida si otro origen/destino está correctamente rellenado
   */
  otroOrigenDestinoValido(): boolean {
    const otroOrigenDestino = this.entradaSalidaForm.get('otroOrigenDestino')?.value;
    return !!otroOrigenDestino && otroOrigenDestino.trim() !== '';
  }
  
  /**
   * Valida si el DCS tiene el formato correcto
   */
  dcsValido(): boolean {
    const dcs = this.entradaSalidaForm.get('dcs')?.value;
    return this.validationService.dcsValido(dcs);
  }
  
  /**
   * Verifica si la previsión es válida solo para campos simples (para UI)
   * Usado para determinar si mostrar campos en rojo o no
   */
  previsionEsValidaCampoSimple(): boolean {
    const perfumeria = this.entradaSalidaForm.get('perfumeria')?.value;
    const pdv = this.entradaSalidaForm.get('pdv')?.value;
    const colaborador = this.entradaSalidaForm.get('colaborador')?.value;
    const otroOrigenDestino = this.entradaSalidaForm.get('otroOrigenDestino')?.value;
    const dcs = this.entradaSalidaForm.get('dcs')?.value;
  
    // Validar que perfumería y PDV vayan juntos
    const perfumeriaPdvCompleto = (perfumeria && pdv) || (!perfumeria && !pdv);
    if (!perfumeriaPdvCompleto) {
      return false;
    }
  
    // Casos válidos de origen/destino
    const tienePerfumeriaPdv = perfumeria && pdv;
    const tieneColaborador = colaborador && colaborador.trim() !== '';
    const tieneOtroOrigenDestino = otroOrigenDestino && otroOrigenDestino.trim() !== '';
    const tieneDcs = dcs && dcs.trim() !== '';
    const dcsEsValido = this.validationService.dcsValido(dcs);
  
    // Combinaciones válidas
    const combinacionesValidas = [
      tienePerfumeriaPdv && !tieneColaborador && !tieneOtroOrigenDestino,
      !tienePerfumeriaPdv && tieneColaborador && !tieneOtroOrigenDestino,
      !tienePerfumeriaPdv && !tieneColaborador && tieneOtroOrigenDestino,
      tienePerfumeriaPdv && tieneColaborador && !tieneOtroOrigenDestino,
      tienePerfumeriaPdv && !tieneColaborador && tieneOtroOrigenDestino,
      !tienePerfumeriaPdv && !tieneColaborador && !tieneOtroOrigenDestino && tieneDcs && dcsEsValido,
    ];
  
    return combinacionesValidas.some((c) => c);
  }
  
  /**
   * Verifica si una referencia es de producto especial
   */
  esProductoEspecial(referencia: string): boolean {
    return this.validationService.esProductoEspecial(referencia);
  }

  // ============================================
  // MÉTODOS PARA TEMPLATE
  // ============================================

  getEstadosDisponibles(index: number, esSalida: boolean): string[] {
    if (esSalida) {
      const estadosDisponibles = this.stockManager.getEstadosDisponibles(index);
      return estadosDisponibles || this.estados.map(e => e.nombre!);
    }
    return this.estados.map(e => e.nombre!);
  }

  getUbicacionesPorIndice(index: number): Ubicacion[] {
    return this.stockManager.getUbicacionesPorIndice(
      this.productosControls,
      index,
      this.validationService.esProductoEspecial.bind(this.validationService)
    );
  }

  esEstadoRequerido(index: number): boolean {
    const ref = this.productosControls.at(index).get('ref')?.value;
    return !this.validationService.esProductoEspecial(ref);
  }

  unidadesExcedenStock(index: number): boolean {
    if (!this.esSalida()) return false;

    return this.stockManager.unidadesExcedenStock(
      this.productosControls,
      index,
      this.validationService.esProductoEspecial.bind(this.validationService)
    );
  }

  getStockDisponible(index: number): number {
    const producto = this.productosControls.at(index);
    const referencia = producto.get('ref')?.value;
    const estado = producto.get('estado')?.value;
    const ubicacion = producto.get('ubicacion')?.value;

    if (!referencia || !estado || !ubicacion) return 0;

    return this.stockManager.getStockDisponible(index, referencia, estado, ubicacion);
  }

  getMensajeStock(index: number): string {
    if (!this.esSalida()) return '';

    const producto = this.productosControls.at(index);
    const referencia = producto.get('ref')?.value;
    const estado = producto.get('estado')?.value;
    const ubicacion = producto.get('ubicacion')?.value;

    if (!referencia || !estado || !ubicacion) return '';

    return this.stockManager.getMensajeStock(
      index,
      referencia,
      estado,
      ubicacion,
      this.currentPath,
      this.validationService.esProductoEspecial.bind(this.validationService)
    );
  }

  mostrarInfoDivisionDetallada(index: number): string {
    return this.stockManager.mostrarInfoDivisionDetallada(
      this.productosControls,
      index,
      this.validationService.esProductoEspecial.bind(this.validationService)
    );
  }

  validarDuplicadosEnTiempoReal(index: number): boolean {
    return this.validationService.validarDuplicadoEnTiempoReal(this.productosControls, index);
  }

  obtenerStockEspecifico(referencia: string, estado: string, ubicacion: string): number {
    return this.stockManager.obtenerStockEspecifico(referencia, estado, ubicacion);
  }
}