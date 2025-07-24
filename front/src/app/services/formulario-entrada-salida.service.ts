import {
  ChangeDetectorRef,
  ElementRef,
  HostListener,
  Injectable,
  ViewChild,
} from '@angular/core';
import { inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Entrada } from 'src/app/models/entrada.model';
import { ProductoEntrada } from 'src/app/models/productoEntrada.model';
import { EntradaServices } from 'src/app/services/entrada.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UbicacionService } from './ubicacion.service';
import { Ubicacion } from '../models/ubicacion.model';
import { SalidaServices } from './salida.service';
import { Salida } from '../models/salida.model';
import { ProductoSalida } from '../models/productoSalida.model';
import { AgenciasTransporteService } from './agencias-transporte.service';
import { AgenciaTransporte } from '../models/agencia-transporte.model';
import { PDV } from '../models/pdv.model';
import { Colaborador } from '../models/colaborador.model';
import { Perfumeria } from '../models/perfumeria.model';
import { OtraDireccion } from '../models/otraDireccion.model';
import { Producto } from '../models/producto.model';
import { PantallaCargaService } from './pantalla-carga.service';
import { DireccionesService } from './direcciones.service';
import { ImportarExcelService } from './importar-excel.service';
import { SalidaUbicacionService } from './salida-ubicacion.service';
import { Estado } from '../models/estado.model';
import { EstadoService } from './estado.service';

@Injectable()
export class FormularioEntradaSalidaService {
  entradaSalidaForm!: FormGroup;
  pendiente: boolean = true;
  productosNuevos: Set<number> = new Set();
  mostrarFormulario: boolean = false;
  ubicaciones: String[] = [];
  estados: Estado[] = [];

  perfumerias: Perfumeria[] = [];
  pdvs: PDV[] = [];
  colaboradores: Colaborador[] = [];
  otrasDirecciones: OtraDireccion[] = [];
  otraDireccionSeleccionada: OtraDireccion | null = null;
  perfumeriaSeleccionada: Perfumeria | null = null;
  pdvSeleccionado: PDV | null = null;
  colaboradorSeleccionado: Colaborador | null = null;

  btnSubmitActivado = true;
  currentPath: string = window.location.pathname;
  ubicacionesPorProducto: { [ref: string]: Ubicacion[] } = {};
  visuales: Producto[] = [];
  productosSR: Producto[] = [];
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;

  // Propiedades para manejar estados dinámicos
  estadosDisponiblesPorProducto: { [index: number]: string[] } = {};
  ubicacionesPorProductoYEstado: { [key: string]: Ubicacion[] } = {};

  stockDisponiblePorProducto: { [key: string]: number } = {};

  private snackBar = inject(MatSnackBar);

  constructor(
    protected fb: FormBuilder,
    protected productoService: ProductoServices,
    protected entradaService: EntradaServices,
    protected salidaService: SalidaServices,
    protected ubicacionesService: UbicacionService,
    protected agenciasTransporteService: AgenciasTransporteService,
    protected cdr: ChangeDetectorRef,
    protected direccionesService: DireccionesService,
    protected importarES: ImportarExcelService,
    protected carga: PantallaCargaService,
    protected salidaUbicacionService: SalidaUbicacionService,
    protected estadosService: EstadoService
  ) {}

  createForm() {
    return this.fb.group({
      // Campos no repetitivos
      fechaRecepcionEnvio: ['', Validators.required],
      perfumeria: ['', Validators.required],
      pdv: ['', Validators.required],
      colaborador: ['', Validators.required],
      otroOrigenDestino: ['', Validators.required],
      direccion: [''],
      poblacion: [''],
      provincia: [''],
      cp: [''],
      telefono: [''],
      dcs: ['', Validators.required],

      // Array de productos
      productos: this.fb.array([]),
    });
  }

  protected createProductoGroup(): FormGroup {
    return this.fb.group({
      productoId: [],
      ref: ['', Validators.required],
      description: ['', Validators.required],
      palets: [0, [Validators.required, Validators.min(0)]],
      bultos: [0, [Validators.required, Validators.min(0)]],
      unidadesPedidas: [''],
      unidades: ['', [Validators.required, Validators.min(1)]],
      ubicacion: ['', Validators.required],
      formaEnvio: ['', Validators.required],
      observaciones: [''],
      comprobado: [!this.esNuevo() ? false : true],
      estado: [null],
    });
  }

  // Getter para acceder fácilmente al FormArray de productos
  get productosControls() {
    return this.entradaSalidaForm.get('productos') as FormArray;
  }

  // Método para añadir un nuevo producto
  agregarProducto() {
    this.productosControls.push(this.createProductoGroup());

    setTimeout(() => {
      const inputsRef = Array.from(
        document.querySelectorAll<HTMLElement>('input[formControlName="ref"]')
      );
      inputsRef[inputsRef.length - 1].focus();
    });
  }

  // Método para eliminar un producto
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

  // Resetear completamente el formulario
  resetForm() {
    if (this.entradaSalidaForm) {
      this.entradaSalidaForm.reset();
      this.entradaSalidaForm.setControl(
        'productos',
        this.createProductoGroup()
      );
    }
    this.entradaSalidaForm = this.createForm();
  }

  sincronizarUbicaciones(posicion: number) {
    if (posicion == 0) {
      const primerProducto = this.productosControls.at(0);
      const ubicacion = primerProducto.get('ubicacion')!.value;

      this.productosControls.controls.forEach((producto) => {
        producto.get('ubicacion')!.setValue(ubicacion);
      });
    }
  }

  sincronizarFormasEnvio(posicion: number) {
    if (posicion == 0) {
      const primerProducto = this.productosControls.at(0);
      const envio = primerProducto.get('formaEnvio')!.value;

      this.productosControls.controls.forEach((producto) => {
        producto.get('formaEnvio')!.setValue(envio);
      });
    }
  }

  // Establecer valores iniciales
  setInitialValues() {
    // Establecer valores para campos individuales
    this.entradaSalidaForm.patchValue({
      fechaRecepcionEnvio: new Date().toISOString().split('T')[0],
      perfumeria: '',
      pdv: '',
      colaborador: '',
      otroOrigenDestino: '',
      direccion: '',
      poblacion: '',
      provincia: '',
      cp: '',
      telefono: '',
      dcs: '',
    });
  }

  // Cuando estoy en Grabar Entrada/Salida
  protected inicializarNuevaEntradaSalida() {
    this.pendiente = false;
    this.mostrarFormulario = true;
    this.setCampoValue('fechaRecepcionEnvio', this.formatearFecha(new Date()));
  }

  onSubmit() {
    this.carga.show();
    this.desactivarBtnSubmit();
    if (this.previsionEsValida()) {
      if (this.esEntrada()) {
        this.onSubmitEntrada();
      } else if (this.esSalida()) {
        this.onSubmitSalida();
      }
    } else {
      this.carga.hide();
      this.btnSubmitActivado = true;
      this.marcarCamposInvalidos();
    }
  }

  // Método para guardar la entrada de productos
  onSubmitEntrada() {
    // Crear el objeto Entrada
    const nuevaEntrada: Entrada = {
      origen: this.entradaSalidaForm.get('otroOrigenDestino')?.value,
      colaborador: this.entradaSalidaForm.get('colaborador')?.value,
      perfumeria: this.entradaSalidaForm.get('perfumeria')?.value,
      pdv: this.entradaSalidaForm.get('pdv')?.value,
      dcs: this.entradaSalidaForm.get('dcs')?.value,
      estado: !this.pendiente,
      productos: this.entradaSalidaForm.get('productos')?.value,
      rellena: false,
      fechaRecepcion: this.entradaSalidaForm.get('fechaRecepcionEnvio')?.value,
    };

    if (this.fechaValida() && this.productosFinalesValidos()) {
      nuevaEntrada.rellena = true;
      this.crearEntrada(nuevaEntrada);
    } else {
      if (this.pendiente) {
        this.crearEntrada(nuevaEntrada);
      } else {
        // Marcar todos los campos como tocados para mostrar validaciones
        this.entradaSalidaForm.markAllAsTouched();
        this.carga.hide();
        this.btnSubmitActivado = true;
      }
    }
  }

  // Método para guardar la salida de productos
  private onSubmitSalida() {
    const productosSalida: ProductoSalida[] =
      this.entradaSalidaForm.value.productos.map((producto: any) => {
        // Crear un nuevo objeto ProductoSalida
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
          estado: producto.estado,
        };
      });

    console.log('Productos salida:', productosSalida);

    // Crear el objeto Salida
    const nuevaSalida: Salida = {
      destino: this.entradaSalidaForm.get('otroOrigenDestino')?.value,
      direccion: this.entradaSalidaForm.get('direccion')?.value,
      poblacion: this.entradaSalidaForm.get('poblacion')?.value,
      provincia: this.entradaSalidaForm.get('provincia')?.value,
      cp: this.entradaSalidaForm.get('cp')?.value,
      telefono: this.entradaSalidaForm.get('telefono')?.value,
      colaborador: this.entradaSalidaForm.get('colaborador')?.value,
      perfumeria: this.entradaSalidaForm.get('perfumeria')?.value,
      pdv: this.entradaSalidaForm.get('pdv')?.value,
      estado: !this.pendiente,
      productos: this.entradaSalidaForm.get('productos')?.value,
      rellena: false,
      fechaEnvio: this.entradaSalidaForm.get('fechaRecepcionEnvio')?.value,
    };

    console.log(nuevaSalida);

    if (
      this.fechaValida() &&
      this.formasEnvioValidas() &&
      this.productosFinalesValidos()
    ) {
      nuevaSalida.rellena = true;
      this.crearSalida(nuevaSalida);
    } else {
      if (this.pendiente) {
        this.crearSalida(nuevaSalida);
      } else {
        // Marcar todos los campos como tocados para mostrar validaciones
        this.entradaSalidaForm.markAllAsTouched();
        this.carga.hide();
        this.btnSubmitActivado = true;
      }
    }
  }

  private crearSalida(nuevaSalida: Salida) {
    this.salidaService.newSalida(nuevaSalida).subscribe({
      next: (salidaCreada) => {
        console.log('Salida creada exitosamente:', salidaCreada);
        this.snackBarExito('Salida guardada correctamente');
        this.resetForm();
        this.carga.hide();
        this.btnSubmitActivado = true;
        this.mostrarFormulario = true;
        this.setCampoValue(
          'fechaRecepcionEnvio',
          this.formatearFecha(new Date())
        );
      },
      error: (error) => {
        console.error('Error al crear la salida:', error);
        this.snackBarError(error.error);
        this.carga.hide();
        this.btnSubmitActivado = true;
      },
    });
  }

  private crearEntrada(nuevaEntrada: Entrada) {
    this.entradaService.newEntrada(nuevaEntrada).subscribe({
      next: (entradaCreada) => {
        console.log('Entrada creada exitosamente:', entradaCreada);
        this.snackBarExito('Entrada guardada correctamente');
        this.resetForm();
        this.mostrarFormulario = true;
        this.setCampoValue(
          'fechaRecepcionEnvio',
          this.formatearFecha(new Date())
        );
        this.carga.hide();
        this.btnSubmitActivado = true;
      },
      error: (error) => {
        const mensaje = this.handleError(error) || error.error;
        console.error('Error al crear la entrada:', error);
        console.error(mensaje);
        this.snackBarError(mensaje);
        this.carga.hide();
        this.btnSubmitActivado = true;
      },
    });
  }

  handleError(error: any) {
    console.log('LLega: ', error);
    try {
      const regex = /Ya existe [^"\\]+/;
      const coincidencia = error.error.message.match(regex);

      if (coincidencia) {
        return coincidencia[0];
      }

      // Si no encontramos el patrón específico, retornamos el mensaje original
      return error.error.message;
    } catch (e) {
      console.error('Error en el parse:', e);
      return error.error.message;
    }
  }

  snackBarError(error: string) {
    this.snackBar.open(error, '✖', {
      duration: 3000,
      panelClass: 'error',
    });
  }

  snackBarExito(mensaje: string) {
    this.snackBar.open(mensaje, '✖', {
      duration: 3000,
      panelClass: 'exito',
    });
  }

  // Buscar producto por referencia y autocompletar descripción - Se llama desde el HTML
  buscarProductoPorReferencia(index: number) {
    const refControl = this.productosControls.at(index).get('ref');
    const descriptionControl = this.productosControls
      .at(index)
      .get('description');
    const estadoControl = this.productosControls.at(index).get('estado');
    const ubicacionControl = this.productosControls.at(index).get('ubicacion');

    if (refControl!.value === 'VISUAL' && this.esSalida()) {
      this.manejarProductoEspecial(index, 'VISUAL');
    } else if (refControl!.value === 'SIN REFERENCIA' && this.esSalida()) {
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
    // Para productos especiales, el estado no es obligatorio
    const estadoControl = this.productosControls.at(index).get('estado');
    estadoControl?.clearValidators();
    estadoControl?.updateValueAndValidity();

    // Limpiar estados disponibles para productos especiales
    delete this.estadosDisponiblesPorProducto[index];

    if (this.esSalida()) {
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
  }

  // Método para limpiar datos cuando se cambia de producto
  private limpiarCamposProducto(index: number) {
    const descriptionControl = this.productosControls
      .at(index)
      .get('description');
    const estadoControl = this.productosControls.at(index).get('estado');
    const ubicacionControl = this.productosControls.at(index).get('ubicacion');
    const unidadesControl = this.productosControls.at(index).get('unidades');

    descriptionControl?.setValue('');
    estadoControl?.setValue(null);
    ubicacionControl?.setValue('');

    // Limpiar validadores específicos
    unidadesControl?.setValidators([Validators.required, Validators.min(1)]);
    unidadesControl?.updateValueAndValidity();

    // Limpiar estados disponibles y stock
    delete this.estadosDisponiblesPorProducto[index];

    // Limpiar stock disponible para este índice
    Object.keys(this.stockDisponiblePorProducto).forEach((key) => {
      if (key.startsWith(`${index}-`)) {
        delete this.stockDisponiblePorProducto[key];
      }
    });
  }

  onEstadoChange(index: number) {
    const refControl = this.productosControls.at(index).get('ref');
    const estadoControl = this.productosControls.at(index).get('estado');
    const ubicacionControl = this.productosControls.at(index).get('ubicacion');
    const unidadesControl = this.productosControls.at(index).get('unidades');

    const referencia = refControl?.value;
    const estado = estadoControl?.value;
    const ubicacionActual = ubicacionControl?.value; // Guardar la ubicación actual

    if (referencia && estado && this.esSalida()) {
      // No limpiar la ubicación automáticamente si ya existe
      // ubicacionControl?.setValue('');

      // Cargar ubicaciones para esta referencia y estado específicos
      this.cargarUbicacionesPorReferenciaYEstado(referencia, estado, index);

      // Si ya hay ubicación seleccionada, validar stock inmediatamente
      if (ubicacionActual) {
        this.validarStockEspecifico(index);
      }

      // Actualizar validadores de unidades
      this.actualizarValidadoresUnidades(index);
    }
  }

  // Nuevo método para manejar cambio de ubicación
  onUbicacionChange(index: number) {
    if (this.esSalida()) {
      this.validarStockEspecifico(index);
      this.actualizarValidadoresUnidades(index);
    }
  }

  // Método actualizado para configurar validadores de unidades
  protected actualizarValidadoresUnidades(index: number) {
    const unidadesControl = this.productosControls.at(index).get('unidades');
    const refControl = this.productosControls.at(index).get('ref');
    const estadoControl = this.productosControls.at(index).get('estado');
    const ubicacionControl = this.productosControls.at(index).get('ubicacion');

    if (!unidadesControl || !this.esSalida()) {
      return;
    }

    const referencia = refControl?.value;
    const estado = estadoControl?.value;
    const ubicacion = ubicacionControl?.value;

    if (
      referencia &&
      estado &&
      ubicacion &&
      !this.esProductoEspecial(referencia)
    ) {
      const stockDisponible = this.obtenerStockEspecifico(
        referencia,
        estado,
        ubicacion
      );

      // Configurar validadores con el stock específico
      unidadesControl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(stockDisponible),
      ]);

      console.log(
        `Validadores actualizados para producto ${index}: max ${stockDisponible}`
      );
    } else {
      // Validadores por defecto
      unidadesControl.setValidators([Validators.required, Validators.min(1)]);
    }

    unidadesControl.updateValueAndValidity();
  }

  // Método actualizado para verificar si las unidades exceden el stock disponible
  unidadesExcedenStock(index: number): boolean {
    if (!this.esSalida()) {
      return false;
    }

    const unidadesControl = this.productosControls.at(index).get('unidades');
    const refControl = this.productosControls.at(index).get('ref');
    const estadoControl = this.productosControls.at(index).get('estado');
    const ubicacionControl = this.productosControls.at(index).get('ubicacion');

    const unidades = unidadesControl?.value || 0;
    const referencia = refControl?.value;
    const estado = estadoControl?.value;
    const ubicacion = ubicacionControl?.value;

    if (
      !referencia ||
      !estado ||
      !ubicacion ||
      this.esProductoEspecial(referencia)
    ) {
      return false;
    }

    const stockDisponible = this.obtenerStockEspecifico(
      referencia,
      estado,
      ubicacion
    );
    return unidades > stockDisponible;
  }

  // Nuevo método para validar stock específico
  protected validarStockEspecifico(index: number) {
    const refControl = this.productosControls.at(index).get('ref');
    const estadoControl = this.productosControls.at(index).get('estado');
    const ubicacionControl = this.productosControls.at(index).get('ubicacion');

    const referencia = refControl?.value;
    const estado = estadoControl?.value;
    const ubicacion = ubicacionControl?.value;

    if (
      referencia &&
      estado &&
      ubicacion &&
      !this.esProductoEspecial(referencia)
    ) {
      // Buscar el stock específico en la ubicación y estado seleccionados
      const stockDisponible = this.obtenerStockEspecifico(
        referencia,
        estado,
        ubicacion
      );

      // Guardar el stock disponible para este producto
      const key = `${index}-${referencia}-${estado}-${ubicacion}`;
      this.stockDisponiblePorProducto[key] = stockDisponible;

      console.log(
        `Stock disponible para ${referencia} estado ${estado} en ${ubicacion}: ${stockDisponible}`
      );
    }
  }

  // Nuevo método para obtener stock específico de una ubicación y estado
  protected obtenerStockEspecifico(
    referencia: string,
    estado: string,
    ubicacionNombre: string
  ): number {
    const key = `${referencia}-${estado}`;
    const ubicaciones = this.ubicacionesPorProductoYEstado[key] || [];

    const ubicacionEncontrada = ubicaciones.find(
      (ubi) => ubi.nombre === ubicacionNombre
    );
    if (!ubicacionEncontrada) {
      return 0;
    }

    const productoEnUbicacion = ubicacionEncontrada.productos?.find(
      (p) => p.ref === referencia && p.estado === estado
    );

    return productoEnUbicacion?.unidades || 0;
  }

  // Método para obtener el stock disponible de un producto específico (para mostrar en UI)
  getStockDisponible(index: number): number {
    const refControl = this.productosControls.at(index).get('ref');
    const estadoControl = this.productosControls.at(index).get('estado');
    const ubicacionControl = this.productosControls.at(index).get('ubicacion');

    const referencia = refControl?.value;
    const estado = estadoControl?.value;
    const ubicacion = ubicacionControl?.value;

    if (
      !referencia ||
      !estado ||
      !ubicacion ||
      this.esProductoEspecial(referencia)
    ) {
      return 0;
    }

    return this.obtenerStockEspecifico(referencia, estado, ubicacion);
  }

  private procesarRespuestaProducto(response: any, index: number) {
    const descriptionControl = this.productosControls
      .at(index)
      .get('description');
    const estadoControl = this.productosControls.at(index).get('estado');
    const ubicacionControl = this.productosControls.at(index).get('ubicacion');

    if (response) {
      if (response.estados && response.estados.length > 1) {
        // Producto con múltiples estados
        descriptionControl!.setValue(response.description);
        this.productosNuevos.delete(index);

        // Configurar estados disponibles
        this.estadosDisponiblesPorProducto[index] = response.estados.map(
          (e: any) => e.estado
        );

        // Hacer el estado obligatorio para productos normales
        estadoControl?.setValidators([Validators.required]);
        estadoControl?.updateValueAndValidity();

        // Solo limpiar estado y ubicación si no tienen valores
        if (!estadoControl?.value) {
          estadoControl?.setValue(null);
        }
        if (!ubicacionControl?.value) {
          ubicacionControl?.setValue('');
        }

        if (this.esSalida()) {
          // Si ya hay estado seleccionado, cargar ubicaciones
          if (estadoControl?.value) {
            this.cargarUbicacionesPorReferenciaYEstado(
              response.referencia,
              estadoControl.value,
              index
            );
          }
        }
      } else if (response.estados && response.estados.length === 1) {
        // Producto con un solo estado
        descriptionControl!.setValue(response.description);

        // Solo establecer el estado si no está ya establecido
        if (!estadoControl?.value) {
          estadoControl?.setValue(response.estados[0].estado);
        }

        this.productosNuevos.delete(index);

        // Hacer el estado obligatorio
        estadoControl?.setValidators([Validators.required]);
        estadoControl?.updateValueAndValidity();

        if (this.esSalida()) {
          this.setMaxUnidades(index, response.estados[0].stock);
          this.cargarUbicacionesPorReferenciaYEstado(
            response.referencia,
            response.estados[0].estado,
            index
          );
        }
      } else if (response.referencia) {
        // Producto tradicional (respuesta directa)
        descriptionControl!.setValue(response.description);
        this.productosNuevos.delete(index);

        // Hacer el estado obligatorio
        estadoControl?.setValidators([Validators.required]);
        estadoControl?.updateValueAndValidity();

        if (this.esSalida()) {
          this.setMaxUnidades(index, response.stock);
          this.obtenerUbicacionesProductoSalida(response.referencia);
        }
      }
    } else {
      this.productosNuevos.add(index);
      this.limpiarCamposProducto(index);
    }
  }

  protected cargarUbicacionesPorReferenciaYEstado(
    referencia: string,
    estado: string,
    index: number
  ) {
    const key = `${referencia}-${estado}`;

    // Cargar ubicaciones si no están ya cargadas
    if (!this.ubicacionesPorProductoYEstado[key]) {
      this.ubicacionesService
        .getUbicacionesByReferenciaAndEstado(referencia, estado)
        .subscribe({
          next: (data: Ubicacion[]) => {
            this.ubicacionesPorProductoYEstado[key] = data;
            // Después de cargar, verificar si hay ubicación guardada para este índice específico
            this.verificarUbicacionGuardada(index);
          },
          error: (error) => {
            console.error(
              'Error al obtener ubicaciones por referencia y estado:',
              error
            );
            this.ubicacionesPorProductoYEstado[key] = [];
          },
        });
    } else {
      // Si ya están cargadas, verificar inmediatamente
      this.verificarUbicacionGuardada(index);
    }
  }

  // Nuevo método para verificar y establecer la ubicación guardada
  private verificarUbicacionGuardada(index: number) {
    const ubicacionControl = this.productosControls.at(index).get('ubicacion');
    const ubicacionGuardada = ubicacionControl?.value;

    if (ubicacionGuardada) {
      // Forzar la actualización del valor para que se muestre correctamente
      setTimeout(() => {
        ubicacionControl?.setValue(ubicacionGuardada);
        ubicacionControl?.updateValueAndValidity();
      }, 100);
    }
  }

  // Método para obtener ubicaciones filtradas por referencia y estado
  getUbicacionesPorIndice(index: number): Ubicacion[] {
    const refControl = this.productosControls.at(index).get('ref');
    const estadoControl = this.productosControls.at(index).get('estado');
    const descriptionControl = this.productosControls
      .at(index)
      .get('description');

    const referencia = refControl?.value;
    const estado = estadoControl?.value;
    const descripcion = descriptionControl?.value;

    if (this.esProductoEspecial(referencia)) {
      // Para productos especiales, usar descripción
      return this.ubicacionesPorProducto[descripcion] || [];
    } else if (referencia && estado) {
      // Para productos normales, usar referencia + estado
      const key = `${referencia}-${estado}`;
      return this.ubicacionesPorProductoYEstado[key] || [];
    } else if (referencia && !estado) {
      // Si hay referencia pero no estado, mostrar todas las ubicaciones de esa referencia
      return this.ubicacionesPorProducto[referencia] || [];
    }

    return [];
  }

  // Método para obtener estados disponibles por índice
  getEstadosDisponibles(index: number, esSalida: boolean): string[] {
    if (esSalida) {
      return (
        this.estadosDisponiblesPorProducto[index] ||
        this.estados.map((e) => e.nombre)
      );
    } else {
      return this.estados.map((e) => e.nombre!);
    }
  }

  buscarProductoEspecial(index: number) {
    if (this.esSalida()) {
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
  }

  isProductoNuevo(index: number): boolean {
    const ref = this.productosControls.at(index).get('ref')!.value;
    if (ref === 'VISUAL' || ref === 'SIN REFERENCIA') {
      return false;
    }

    return this.productosNuevos.has(index);
  }

  // Se llama al IMPORTAR el Excel
  indice = 0;
  buscarDescripcionProducto(formGroup: FormGroup, ref: String) {
    if (ref !== 'VISUAL' && ref !== 'SIN REFERENCIA') {
      this.productoService.getProductoPorReferencia(ref).subscribe({
        next: (producto) => {
          if (producto == null) {
            this.productosNuevos.add(this.indice);
          } else {
            formGroup.get('description')?.setValue(producto.description);
          }
          this.indice++;
        },
        error: (error) => {
          console.error('Error al buscar producto', error);
        },
      });
    }
    this.indice = 0;
  }

  formatearFecha(fecha: any): string | null {
    if (!fecha) return null;

    // Si la fecha ya está en formato Date o Date string
    if (fecha instanceof Date || typeof fecha === 'string') {
      return new Date(fecha).toISOString().split('T')[0];
    }

    // Si es un número (serial de fecha de Excel)
    if (typeof fecha === 'number') {
      // Convertir número de serie de Excel a fecha
      const excelDate = new Date(Date.UTC(1900, 0, fecha - 1));
      return excelDate.toISOString().split('T')[0];
    }

    return null;
  }

  cargarUbicaciones() {
    this.ubicacionesService.getUbicacionesOrderByNombre().subscribe(
      (ubicaciones: Ubicacion[]) => {
        this.ubicaciones = ubicaciones.map((ubicacion) => ubicacion.nombre!);
      },
      (error) => {
        console.error('Error al obtener ubicaciones', error);
      }
    );
  }

  desactivarBtnSubmit() {
    this.carga.show();
    this.btnSubmitActivado = false;
    if (this.btnSubmitActivado) {
      console.log('El botón está activado');
    } else {
      console.log('El botón está desactivado');
    }
  }

  // Obtener valores individuales
  getCampoValue(CampoName: string) {
    return this.entradaSalidaForm.get(CampoName)?.value;
  }

  // Establecer valor individual
  setCampoValue(CampoName: string, value: any) {
    this.entradaSalidaForm.get(CampoName)?.setValue(value);
  }

  // Obtener producto específico
  getProducto(index: number) {
    return this.productosControls.at(index);
  }

  // Establecer valores para un producto específico
  setProductoValues(index: number, values: any) {
    this.productosControls.at(index).patchValue(values);
  }

  // Establecer valores para todos los productos
  setProductosValues(values: any[]) {
    // Primero, limpiar el array existente
    while (this.productosControls.length) {
      this.productosControls.removeAt(0);
    }

    // Agregar nuevos controles con valores
    values.forEach((producto) => {
      this.productosControls.push(this.fb.group(producto));
    });
  }

  // Observar cambios en el formulario
  private watchFormChanges() {
    // Observar cambios en campos individuales
    this.entradaSalidaForm
      .get('perfumeria')
      ?.valueChanges.subscribe((value) => {
        console.log('Perfumería cambió:', value);
        // Realizar acciones necesarias
      });

    // Observar cambios en el array de productos
    this.productosControls.valueChanges.subscribe((values) => {
      console.log('Productos cambiaron:', values);
      // Realizar acciones necesarias
    });
  }

  // Marcar todos los campos como touched para mostrar errores
  protected marcarCamposInvalidos() {
    Object.keys(this.entradaSalidaForm.controls).forEach((key) => {
      const control = this.entradaSalidaForm.get(key);
      control?.markAsTouched();
    });

    this.productosControls.controls.forEach((control) => {
      const productoGroup = control as FormGroup;
      Object.keys(productoGroup.controls).forEach((key) => {
        const productoControl = productoGroup.get(key);
        productoControl?.markAsTouched();
      });
    });
  }

  esEntrada(): boolean {
    return this.currentPath.startsWith('/entradas');
  }

  esSalida(): boolean {
    return this.currentPath.startsWith('/salidas');
  }

  esNuevo() {
    return this.currentPath.includes('/nuevo');
  }

  campoVacio(nombreCampo: string, index: number) {
    if (
      !this.productosControls.at(index).get(nombreCampo)!.valid &&
      this.productosControls.at(index).get(nombreCampo)!.touched
    ) {
      return true;
    }
    return false;
  }

  campoValido(nombreCampo: string, index: number = -1) {
    // Si los campos son unicos
    if (index == -1) {
      return this.entradaSalidaForm.get(nombreCampo)!.valid;
    }
    // Si los campos se repiten (productos)
    else {
      return this.productosControls.at(index).get(nombreCampo)!.valid;
    }
  }

  campoSimpleVacio(nombreCampo: string) {
    if (
      !this.entradaSalidaForm.get(nombreCampo)!.valid &&
      this.entradaSalidaForm.get(nombreCampo)!.touched
    ) {
      return true;
    }
    return false;
  }

  refValidaIndex(i: number) {
    const ref = this.productosControls.at(i).get('ref')!.value;
    return this.refValida(ref);
  }

  // Referencia estándar de Chanel
  refValida(ref: string) {
    const refValida =
      /^[0-9]{7}$/.test(ref) ||
      /^R[0-9]{7}$/.test(ref) ||
      /^[A-Za-z0-9]{10}$/.test(ref) ||
      ref === 'VISUAL' ||
      ref === 'SIN REFERENCIA';
    return refValida;
  }

  // Referencia local creada por Francia, no viene de arriba de Chanel
  refLocal(ref: string) {
    if (/^[a-zA-Z]$/.test(ref.charAt(0))) {
      return true;
    }
    return false;
  }

  descriptionValida(i: number) {
    const description = this.productosControls.at(i).get('description')!.value;
    return description && description.trim().length > 0;
  }

  fechaValida() {
    if (this.entradaSalidaForm.get('fechaRecepcionEnvio')?.valid) {
      return true;
    }
    return false;
  }

  perfumeriaValido() {
    const perfumeria = this.entradaSalidaForm.get('perfumeria')?.value;
    const pdv = this.entradaSalidaForm.get('pdv')?.value;

    if ((pdv && !perfumeria) || (!pdv && perfumeria)) {
      return true;
    }
    return false;
  }

  pdvValido() {
    const perfumeria = this.entradaSalidaForm.get('perfumeria')?.value;
    const pdv = this.entradaSalidaForm.get('pdv')?.value;

    if ((pdv && !perfumeria) || (!pdv && perfumeria)) {
      return true;
    }
    return false;
  }

  colaboradorValido() {
    if (this.entradaSalidaForm.get('colaborador')?.valid) {
      return true;
    }
    return false;
  }

  otroOrigenDestinoValido() {
    if (this.entradaSalidaForm.get('otroOrigenDestino')?.valid) {
      return true;
    }
    return false;
  }

  dcsValido() {
    const dcs = this.entradaSalidaForm.get('dcs')?.value;
    const dcsValido = /^[0-9]{10}$/.test(dcs);
    if (dcsValido) {
      return true;
    }
    return false;
  }

  // Comprueba solo en los campos si todo es válido para ponerse en rojo o no
  previsionEsValidaCampoSimple() {
    const perfumeria = this.entradaSalidaForm.get('perfumeria')?.value;
    const pdv = this.entradaSalidaForm.get('pdv')?.value;
    const colaborador = this.entradaSalidaForm.get('colaborador')?.value;
    const otroOrigenDestino =
      this.entradaSalidaForm.get('otroOrigenDestino')?.value;
    const dcs = this.entradaSalidaForm.get('dcs')?.value;
    const dcsValido = /^[0-9]{10}$/.test(dcs);

    // Validar que perfumería y PDV vayan juntos
    const perfumeriaPdvCompleto = (perfumeria && pdv) || (!perfumeria && !pdv);
    if (!perfumeriaPdvCompleto) {
      return false;
    }

    // Casos válidos de origen/destino
    const tienePerfumeriaPdv = perfumeria && pdv;
    const tieneColaborador = colaborador && colaborador.trim() !== '';
    const tieneOtroOrigenDestino =
      otroOrigenDestino && otroOrigenDestino.trim() !== '';
    const tieneDcs = dcs && dcs.trim() !== '';

    // Combinaciones válidas (misma lógica que previsionEsValida pero sin mostrar errores)
    const combinacionesValidas = [
      tienePerfumeriaPdv && !tieneColaborador && !tieneOtroOrigenDestino,
      !tienePerfumeriaPdv && tieneColaborador && !tieneOtroOrigenDestino,
      !tienePerfumeriaPdv && !tieneColaborador && tieneOtroOrigenDestino,
      tienePerfumeriaPdv && tieneColaborador && !tieneOtroOrigenDestino,
      tienePerfumeriaPdv && !tieneColaborador && tieneOtroOrigenDestino,
      !tienePerfumeriaPdv &&
        !tieneColaborador &&
        !tieneOtroOrigenDestino &&
        tieneDcs &&
        dcsValido,
    ];

    return combinacionesValidas.some((c) => c);
  }

  // Comprueba todo al completo de los campos simples y muestra los errores
  previsionEsValida() {
    const perfumeria = this.entradaSalidaForm.get('perfumeria')?.value;
    const pdv = this.entradaSalidaForm.get('pdv')?.value;
    const colaborador = this.entradaSalidaForm.get('colaborador')?.value;
    const otroOrigenDestino = this.entradaSalidaForm.get('otroOrigenDestino')?.value;
    const dcs = this.entradaSalidaForm.get('dcs')?.value;
    const hayProductos = this.productosControls.length > 0;
    const productosValidos = this.productosPrevisionSonValidos();
    const dcsValido = /^[0-9]{10}$/.test(dcs);
  
    // Verificar que Perfumería y PDV van juntos
    const perfumeriaPdvValido = (!perfumeria && !pdv) || (perfumeria && pdv);
    const tienePerfumeriaPdv = perfumeria && pdv;
  
    // Casos válidos de origen/destino (ahora permite combinaciones)
    const tieneColaborador = !!colaborador;
    const tieneOtroOrigenDestino = !!otroOrigenDestino;
    const tieneDcs = !!dcs && dcsValido;
  
    // Verificar que hay al menos un origen válido
    const tieneAlgunOrigen =
      tienePerfumeriaPdv ||
      (tieneColaborador && !tieneOtroOrigenDestino && !tienePerfumeriaPdv) ||
      (tieneOtroOrigenDestino && !tieneColaborador && !tienePerfumeriaPdv) ||
      (tienePerfumeriaPdv && tieneColaborador && !tieneOtroOrigenDestino) ||
      (tienePerfumeriaPdv && tieneOtroOrigenDestino && !tieneColaborador);
  
    // Combinaciones válidas
    const combinacionValida =
      (tieneDcs && !tieneAlgunOrigen) || (!tieneDcs && tieneAlgunOrigen);
  
    // NUEVA VALIDACIÓN: Verificar líneas duplicadas
    const hayDuplicados = this.hayLineasDuplicadas();
  
    // NUEVA VALIDACIÓN: Verificar estados de productos
    const estadosValidos = this.validarEstadosProductos();
  
    let previsionValida =
      combinacionValida &&
      perfumeriaPdvValido &&
      hayProductos &&
      productosValidos &&
      !hayDuplicados &&
      estadosValidos; // Agregar esta validación
  
    // Mensajes de error específicos
    if (!perfumeriaPdvValido) {
      this.snackBarError('Perfumeria y PDV deben estar rellenos conjuntamente');
    } else if (tieneDcs && tieneAlgunOrigen) {
      this.snackBarError(
        'Debe seleccionar DCS o campos de ' +
          this.getOrigenODestino() +
          ', no ambos'
      );
    } else if (!tieneDcs && !tieneAlgunOrigen) {
      this.snackBarError(
        'Faltan campos por rellenar o tiene una combinación inválida de direcciones'
      );
    } else if (!hayProductos) {
      this.snackBarError('Debe haber al menos 1 producto');
    } else if (dcs && !dcsValido) {
      this.snackBarError('El DCS debe tener 10 dígitos');
    } else if (!estadosValidos) {
      this.snackBarError('Los productos normales deben tener estado asignado');
    } else if (hayDuplicados) {
      // Mostrar detalles de las líneas duplicadas
      const duplicados = this.obtenerLineasDuplicadas();
      const mensajeDuplicados = duplicados
        .map(
          (d) =>
            `Líneas ${d.indices.map((i) => i + 1).join(', ')}: ${d.detalle}`
        )
        .join('\n');
  
      this.snackBarError(
        `Hay líneas duplicadas. Combine las unidades en una sola línea:\n${mensajeDuplicados}`
      );
      this.carga.hide();
    }
  
    return previsionValida;
  }
  
  // NUEVO método para validar estados
  private validarEstadosProductos(): boolean {
    return this.productosControls.controls.every((producto) => {
      const ref = producto.get('ref')?.value;
      const estado = producto.get('estado')?.value;
      
      // Si es producto especial, el estado puede ser null
      if (this.esProductoEspecial(ref)) {
        return true;
      }
      
      // Si es producto normal, debe tener estado
      return estado != null && estado.trim() !== '';
    });
  }
  
  esEstadoRequerido(index: number): boolean {
    const refControl = this.productosControls.at(index).get('ref');
    const referencia = refControl?.value;
  
    // El estado no es requerido para productos especiales
    return !this.esProductoEspecial(referencia);
  }

  productosPrevisionSonValidos(): boolean {
    let previsionValida = false;

    previsionValida = this.productosControls.controls.every((producto) => {
      const ref = producto.get('ref')?.value;
      const description = producto.get('description')?.value;
      const unidades = producto.get('unidades')?.value;
      const unidadesPedidas = producto.get('unidadesPedidas')?.value;

      const refValida = this.refValida(ref);
      const descriptionValida = description && description.trim().length > 0;
      const unidadesPedidasValidas = unidadesPedidas >= 0;
      const unidadesValidas =
        unidades > 0 ||
        (this.esSalida() &&
          !this.currentPath.startsWith('/entradas/nuevo') &&
          unidadesPedidasValidas);

      if (!refValida) {
        this.snackBarError(
          'Las Referencias deben tener 7 dígitos, R seguida de 7 dígitos o 10 caracteres'
        );
      } else if (!descriptionValida) {
        this.snackBarError('Las descripciones no pueden estar en blanco');
      } else if (
        !unidadesPedidasValidas &&
        this.esSalida() &&
        !this.currentPath.startsWith('/salidas/nuevo')
      ) {
        this.snackBarError(
          'Las UNIDADES PEDIDAS deben ser mayor o igual que 0'
        );
      } else if (!unidadesValidas) {
        this.snackBarError('Las UNIDADES deben ser mayor que 0');
      }

      return refValida && descriptionValida && unidadesValidas;
    });

    return previsionValida;
  }

  productosFinalesValidos() {
    return this.productosControls.controls.every((producto) => {
      const palets = producto.get('palets')?.value;
      const bultos = producto.get('bultos')?.value;

      const paletsValidos = palets >= 0;
      const bultosValidos = bultos >= 0;
      const ubicacionValida = producto.get('ubicacion')?.valid;

      if (!paletsValidos) {
        this.snackBarError('Los palets deben ser igual o mayor que 0');
      } else if (!bultosValidos) {
        this.snackBarError('Los bultos deben ser igual o mayor que 0');
      } else if (!ubicacionValida) {
        this.snackBarError('Las ubicaciones son obligatorias');
      }

      return paletsValidos && bultosValidos && ubicacionValida;
    });
  }

  formasEnvioValidas() {
    return this.productosControls.controls.every((producto) => {
      const formaEnvio = producto.get('formaEnvio')?.valid;

      if (!formaEnvio) {
        this.snackBarError('La Forma de Envío es obligatoria');
      }

      return formaEnvio;
    });
  }

  getOrigenODestino() {
    if (this.esEntrada()) {
      return 'Origen';
    } else if (this.esSalida()) {
      return 'Salida';
    }
    return null;
  }

  setMaxUnidades(index: number, stock: number = 0) {
    const unidadesControl = this.productosControls.at(index).get('unidades');
    if (unidadesControl) {
      unidadesControl.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(stock),
      ]);
      unidadesControl.updateValueAndValidity();
    }
  }

  obtenerUbicacionesProductoSalida(ref: string) {
    if (this.ubicacionesPorProducto[ref]) {
      return;
    }

    this.ubicacionesService.getUbicacionesByReferenciaProducto(ref).subscribe({
      next: (data: Ubicacion[]) => {
        this.ubicacionesPorProducto[ref] = data; // Almacena las ubicaciones en el objeto
      },
      error: (error) => {
        console.error('Error al obtener ubicaciones:', error);
        this.ubicacionesPorProducto[ref] = [];
      },
    });
  }

  cargarVisuales() {
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

  cargarProductosSinReferencia() {
    this.productoService
      .getProductosSinReferenciaPaginado(this.pageIndex, this.pageSize)
      .subscribe(
        (data) => {
          this.productosSR = data.content;
        },
        (error) => {
          console.error('Error al obtener los Visuales', error);
        }
      );
  }

  cargarVisualesPorDescripcion(descripcion: string) {
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

  cargarProductosSinReferenciaPorDescripcion(descripcion: string) {
    this.productoService
      .getProductosSinReferenciaPorDescripcionPaginado(
        descripcion,
        this.pageIndex,
        this.pageSize
      )
      .subscribe(
        (data) => {
          console.log(data);
          this.productosSR = data.content;
        },
        (error) => {
          console.error('Error al obtener los Visuales', error);
        }
      );
  }

  esProductoEspecial(referencia: String) {
    if (referencia == null) return false;
    return 'VISUAL' == referencia || 'SIN REFERENCIA' == referencia;
  }

  // Método para verificar si hay líneas duplicadas
  private hayLineasDuplicadas(): boolean {
    const lineasUnicas = new Set<string>();

    for (let i = 0; i < this.productosControls.length; i++) {
      const control = this.productosControls.at(i);
      const ref = control.get('ref')?.value?.trim();
      const description = control.get('description')?.value?.trim();
      const estado = control.get('estado')?.value;
      const ubicacion = control.get('ubicacion')?.value?.trim();

      // Solo validar si todos los campos están completos
      if (ref && description && ubicacion) {
        let claveLinea: string;

        if (this.esProductoEspecial(ref)) {
          // Para productos especiales: referencia + descripción + ubicación
          claveLinea = `${ref}|${description}|${ubicacion}`;
        } else {
          // Para productos normales: referencia + estado + ubicación
          // Si no hay estado, usar 'null' como placeholder
          const estadoKey = estado || 'null';
          claveLinea = `${ref}|${estadoKey}|${ubicacion}`;
        }

        if (lineasUnicas.has(claveLinea)) {
          return true; // Hay duplicados
        }

        lineasUnicas.add(claveLinea);
      }
    }

    return false; // No hay duplicados
  }

  // Método para obtener detalles de las líneas duplicadas
  private obtenerLineasDuplicadas(): { indices: number[]; detalle: string }[] {
    const mapaLineas = new Map<string, number[]>();
    const duplicados: { indices: number[]; detalle: string }[] = [];

    for (let i = 0; i < this.productosControls.length; i++) {
      const control = this.productosControls.at(i);
      const ref = control.get('ref')?.value?.trim();
      const description = control.get('description')?.value?.trim();
      const estado = control.get('estado')?.value;
      const ubicacion = control.get('ubicacion')?.value?.trim();

      if (ref && description && ubicacion) {
        let claveLinea: string;
        let detalleLinea: string;

        if (this.esProductoEspecial(ref)) {
          claveLinea = `${ref}|${description}|${ubicacion}`;
          detalleLinea = `${ref} - ${description} en ${ubicacion}`;
        } else {
          const estadoKey = estado || 'null';
          claveLinea = `${ref}|${estadoKey}|${ubicacion}`;
          detalleLinea = `${ref}${
            estado ? ` (${estado})` : ''
          } en ${ubicacion}`;
        }

        if (!mapaLineas.has(claveLinea)) {
          mapaLineas.set(claveLinea, []);
        }

        mapaLineas.get(claveLinea)!.push(i);

        // Si ya hay más de una línea con la misma clave, es duplicado
        if (mapaLineas.get(claveLinea)!.length > 1) {
          // Verificar si ya está en la lista de duplicados
          const duplicadoExistente = duplicados.find(
            (d) => d.detalle === detalleLinea
          );
          if (!duplicadoExistente) {
            duplicados.push({
              indices: mapaLineas.get(claveLinea)!,
              detalle: detalleLinea,
            });
          } else {
            // Actualizar los índices
            duplicadoExistente.indices = mapaLineas.get(claveLinea)!;
          }
        }
      }
    }

    return duplicados;
  }

  // Método para validar duplicados en tiempo real (opcional)
  validarDuplicadosEnTiempoReal(index: number): boolean {
    const controlActual = this.productosControls.at(index);
    const refActual = controlActual.get('ref')?.value?.trim();
    const descriptionActual = controlActual.get('description')?.value?.trim();
    const estadoActual = controlActual.get('estado')?.value;
    const ubicacionActual = controlActual.get('ubicacion')?.value?.trim();

    if (!refActual || !descriptionActual || !ubicacionActual) {
      return false; // No está completo, no se puede validar
    }

    let claveActual: string;
    if (this.esProductoEspecial(refActual)) {
      claveActual = `${refActual}|${descriptionActual}|${ubicacionActual}`;
    } else {
      const estadoKey = estadoActual || 'null';
      claveActual = `${refActual}|${estadoKey}|${ubicacionActual}`;
    }

    // Verificar si hay otra línea con la misma clave
    for (let i = 0; i < this.productosControls.length; i++) {
      if (i === index) continue; // Saltar la línea actual

      const control = this.productosControls.at(i);
      const ref = control.get('ref')?.value?.trim();
      const description = control.get('description')?.value?.trim();
      const estado = control.get('estado')?.value;
      const ubicacion = control.get('ubicacion')?.value?.trim();

      if (ref && description && ubicacion) {
        let clave: string;
        if (this.esProductoEspecial(ref)) {
          clave = `${ref}|${description}|${ubicacion}`;
        } else {
          const estadoKey = estado || 'null';
          clave = `${ref}|${estadoKey}|${ubicacion}`;
        }

        if (clave === claveActual) {
          return true; // Hay duplicado
        }
      }
    }

    return false; // No hay duplicado
  }
  
}
