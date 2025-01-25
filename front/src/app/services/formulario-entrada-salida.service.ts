import { Injectable } from '@angular/core';
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

@Injectable()
export class FormularioEntradaSalidaService {
  entradaSalidaForm!: FormGroup;
  pendiente: boolean = true;
  productosNuevos: Set<number> = new Set();
  mostrarFormulario: boolean = false;
  ubicaciones: Ubicacion[] = [];
  perfumerias: Perfumeria[]= [];
  pdvs: PDV[] = [];
  colaboradores: Colaborador[] = [];
  btnSubmitActivado = true;
  currentPath: string = window.location.pathname;

  private snackBar = inject(MatSnackBar);

  constructor(
    protected fb: FormBuilder,
    protected productoService: ProductoServices,
    protected entradaService: EntradaServices,
    protected salidaService: SalidaServices,
    protected ubicacionesService: UbicacionService,
    protected agenciasTransporteService: AgenciasTransporteService
  ) {}

  initForm() {
    return this.fb.group({
      productos: this.fb.array([this.crearProductoFormGroup()]),
    });
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.agregarProducto();
      
      setTimeout(() => {
        // Usar document.querySelector directamente
        const filas = document.querySelectorAll('tbody tr');
        const ultimaFila = filas[filas.length - 1];
        const tercerInput = ultimaFila.querySelectorAll('input')[2];
        if (tercerInput) {
          tercerInput.focus();
        }
      });
    }
  }
  
  // Getter para acceder fácilmente al FormArray de productos
  get productosControls() {
    return this.entradaSalidaForm.get('productos') as FormArray;
  }

  getEstadoCampo(nombreCampo: string, indexCampo: number) {
    const producto = this.productosControls.at(indexCampo);
    const campoVacio = producto.get(nombreCampo)!.invalid;

    if (nombreCampo == 'unidades' && producto.get(nombreCampo)!.value < 0 || 
    campoVacio || 
    nombreCampo == 'formaEnvio' && producto.get(nombreCampo)!.value == '' ||
    nombreCampo == 'formaEnvio' && producto.get(nombreCampo)!.value == null
  ){
      return 'campo-vacio';
    }else {
      return '';
    }
  }

  // Modificar el método crearProductoFormGroup
  crearProductoFormGroup(): FormGroup {
    return this.fb.group({
      fechaRecepcionEnvio: [null, Validators.required],
      perfumeria: [''],
      pdv: [''],
      colaborador: [''],
      otroOrigenDestino: [''],
      direccion: [''],
      poblacion: [''],
      provincia: [''],
      cp: [''],
      telefono: [''],
      dcs: [''],
      ref: ['',
        // {
        //   validators: [
        //     Validators.required,
        //     Validators.minLength(7),
        //     Validators.maxLength(8),
        //   ],
        //   asyncValidators: [this.referenciaValidator.bind(this)],
        //   updateOn: 'blur',
        // },
      ],
      descripcion: [''],
      palets: [''],
      bultos: [0],
      unidadesPedidas: [1],
      unidadesEnviadas: [1],
      ubicacion: [''],
      observaciones: [''],
      formaEnvio: [''],
      pendiente: [false],
    });
  }

  // Método para añadir un nuevo producto
  agregarProducto() {
    const ultimoProducto = this.productosControls.at(
      this.productosControls.length - 1
    );
    const nuevoProducto = this.crearProductoFormGroup();

    // Copiar el número de entrada del último producto
    const numeroEntradaSalida = ultimoProducto.get('numeroEntradaSalida')!.value;
    nuevoProducto.get('numeroEntradaSalida')!.setValue(numeroEntradaSalida);
    const ultimoFechaRecepcionEnvio = ultimoProducto.get('fechaRecepcionEnvio')!.value;
    nuevoProducto.get('fechaRecepcionEnvio')!.setValue(ultimoFechaRecepcionEnvio);

    this.productosControls.push(nuevoProducto);
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
    this.entradaSalidaForm = this.fb.group({
      productos: this.fb.array([this.crearProductoFormGroup()]),
    });
    this.productosNuevos = new Set();
  }

  // Modificar el validador asíncrono
  referenciaValidator(
    control: AbstractControl
  ): Observable<ValidationErrors | null> {
    const ref = control.value;

    // Verificar si la referencia cumple el formato esperado
    const formatoValido = /^\d{7}$|^R\d{7}$/.test(ref);
    if (!formatoValido) {
      // Mostrar el snackBar con el mensaje de error
      this.snackBarError(
        'Referencia inválida. Debe tener 7 dígitos o R seguido de 7 dígitos.'
      );
      return of({ referenciaInvalida: true });
    }

    // Validar con el servicio
    return this.productoService.getProductoPorReferencia(ref).pipe(
      map((producto) => null),
      catchError(() => {
        // Mostrar otro mensaje en caso de error del servicio
        // this.snackBarError('Error al validar la referencia.');
        return of({ referenciaInvalida: true });
      })
    );
  }

  // Sincronizar número de entrada en todas las filas
  sincronizarEntrada() {
    const primerProducto = this.productosControls.at(0);
    const numeroEntradaSalida = primerProducto.get('numeroEntradaSalida')!.value;
    const fechaRecepcionEnvio = primerProducto.get('fechaRecepcionEnvio')!.value;

    this.productosControls.controls.forEach((producto) => {
      producto.get('numeroEntradaSalida')!.setValue(numeroEntradaSalida);
      producto.get('fechaRecepcionEnvio')!.setValue(fechaRecepcionEnvio);
    });
  }

  sincronizarUbicaciones(posicion: number) {
    if(posicion == 0){
      const primerProducto = this.productosControls.at(0);
      const ubicacion = primerProducto.get('ubicacion')!.value;
      
      this.productosControls.controls.forEach((producto) => {
        producto.get('ubicacion')!.setValue(ubicacion);
      })
    }
  }

  getCurrentPathIsSalida(){
    return this.currentPath.startsWith('/salidas');
  }

  onSubmit() {
    if(this.currentPath.startsWith('/entradas')) {
      this.onSubmitEntrada();
    } else if(this.currentPath.startsWith('/salidas')) {
      this.onSubmitSalida();
    }
  }

  // Método para guardar la entrada de productos
  onSubmitEntrada(){
    let referenciasRellenas = true;
    let descriptionRellenas = true;
    let formatoValidoRef = false;
    let unidadesNegativas = false;

    // Obtener el número de entrada del primer producto
    const numeroEntrada = this.productosControls
      .at(0)
      .get('numeroEntradaSalida')!.value;

    // Transformar los productos del formulario a ProductoEntrada
    const productosEntrada: ProductoEntrada[] =
      this.entradaSalidaForm.value.productos.map((producto: any) => {
        // Crear un nuevo objeto ProductoEntrada
        return {
          dcs: producto.dcs,
          ref: producto.ref,
          description: producto.description,
          unidades: producto.unidades,
          fechaRecepcion: producto.fechaRecepcionEnvio
            ? new Date(producto.fechaRecepcionEnvio)
            : undefined,
          ubicacion: producto.ubicacion,
          palets: producto.palets,
          bultos: producto.bultos,
          observaciones: producto.observaciones,
          formaEnvio: producto.formaEnvio,
          pendiente: producto.pendiente,
          idPadre: producto.idPadre
        };
      });

      console.log('Productos entrada:', productosEntrada);

    // Crear el objeto Entrada
    const nuevaEntrada: Entrada = {
      origen: numeroEntrada,
      estado: !this.pendiente,
      productos: productosEntrada,
      rellena: false,
    };

    if (this.entradaSalidaForm.valid) {
      nuevaEntrada.rellena = true;
      this.crearEntrada(nuevaEntrada);
    } else {
      if (
        this.pendiente &&
        numeroEntrada != null &&
        numeroEntrada != undefined &&
        numeroEntrada != '' &&
        referenciasRellenas &&
        formatoValidoRef &&
        descriptionRellenas &&
        !unidadesNegativas
      ) {
        this.crearEntrada(nuevaEntrada);
      } else {
        // Marcar todos los campos como tocados para mostrar validaciones
        this.entradaSalidaForm.markAllAsTouched();
        console.log('Formulario inválido. Errores:', this.entradaSalidaForm.errors);
        if (!this.pendiente) {
          this.snackBarError(
            "Para 'Recibir' una entrada deben estar todos los campos completos y correctos"
          );
        } else if (!referenciasRellenas) {
          this.snackBarError('Las referencias no pueden estar en blanco');
        } else if (!formatoValidoRef) {
          this.snackBarError(
            'Referencia inválida. Debe tener 7 dígitos o R seguido de 7 dígitos.'
          );
        } else if (!descriptionRellenas) {
          this.snackBarError('Las descripiciones no pueden estar en blanco');
        } else if (unidadesNegativas) {
          this.snackBarError(
            'Los productos no pueden tener unidades negativas'
          );
        } else {
          this.snackBarError('El origen no puede estar en blanco');
        }
      }
    }
  }

  // Método para guardar la salida de productos
  private onSubmitSalida() {
    let referenciasRellenas = true;
    let descriptionRellenas = true;
    let formatoValidoRef = false;
    let unidadesNegativas = false;

    // Obtener el número de salida del primer producto
    const numeroSalida = this.productosControls
      .at(0)
      .get('numeroEntradaSalida')!.value;

    // Transformar los productos del formulario a ProductoEntrada
    const productosSalida: ProductoSalida[] =
      this.entradaSalidaForm.value.productos.map((producto: any) => {
        if (
          producto.ref == null ||
          producto.ref == undefined ||
          producto.ref == ''
        ) {
          referenciasRellenas = false;
        }

        formatoValidoRef = /^\d{7}$|^R\d{7}$/.test(producto.ref);

        if (
          producto.description == null ||
          producto.description == undefined ||
          producto.description == ''
        ) {
          descriptionRellenas = false;
        }

        if (producto.unidades < 0) {
          unidadesNegativas = true;
        }

        // Crear un nuevo objeto ProductoEntrada
        return {
          dcs: producto.dcs,
          ref: producto.ref,
          description: producto.description,
          unidades: producto.unidades,
          fechaEnvio: producto.fechaRecepcionEnvio
            ? new Date(producto.fechaRecepcionEnvio)
            : undefined,
          ubicacion: producto.ubicacion,
          palets: producto.palets,
          bultos: producto.bultos,
          formaEnvio: producto.formaEnvio,
          observaciones: producto.observaciones,
          pendiente: producto.pendiente,
          idPadre: producto.idPadre
        };
      });

    // Crear el objeto Salida
    const nuevaSalida: Salida = {
      destino: numeroSalida,
      estado: !this.pendiente,
      productos: productosSalida,
      rellena: false,
    };

    if (this.entradaSalidaForm.valid) { 
      nuevaSalida.rellena = true;
      this.crearSalida(nuevaSalida);
      console.log("Nueva salida: ", nuevaSalida.rellena);
    } else {
      if (
        this.pendiente &&
        numeroSalida != null &&
        numeroSalida != undefined &&
        numeroSalida != '' &&
        referenciasRellenas &&
        formatoValidoRef &&
        descriptionRellenas &&
        !unidadesNegativas
      ) {
        this.crearSalida(nuevaSalida);
        console.log("Nueva salida: ", nuevaSalida.rellena);
      }
      else {
        // Marcar todos los campos como tocados para mostrar validaciones
        this.entradaSalidaForm.markAllAsTouched();
        console.log('Formulario inválido. Errores:', this.entradaSalidaForm.errors);
        if (!this.pendiente) {
          this.snackBarError(
            "Para 'Enviar' una salida deben estar todos los campos completos y correctos"
          );
        } else if (!referenciasRellenas) {
          this.snackBarError('Las referencias no pueden estar en blanco');
        } else if (!formatoValidoRef) {
          this.snackBarError(
            'Referencia inválida. Debe tener 7 dígitos o R seguido de 7 dígitos.'
          );
        } else if (!descriptionRellenas) {
          this.snackBarError('Las descripiciones no pueden estar en blanco');
        } else if (unidadesNegativas) {
          this.snackBarError(
            'Los productos no pueden tener unidades negativas'
          );
        } else {
          this.snackBarError('El destino no puede estar en blanco');
        }
      }
    }
  }

  private crearSalida(nuevaSalida: Salida) {
    this.salidaService.newSalida(nuevaSalida).subscribe({
      next: (salidaCreada) => {
        console.log('Salida creada exitosamente:', salidaCreada);
        this.snackBarExito('Salida guardada correctamente');
        location.reload();
        this.entradaSalidaForm.reset();
        this.entradaSalidaForm.setControl(
          'productos',
          this.fb.array([this.crearProductoFormGroup()])
        );
      },
      error: (error) => {
        console.error('Error completo al crear la salida:', error);
        this.snackBarError(error.error);
      },
    });
  }

  private crearEntrada(nuevaEntrada: Entrada) {
    this.entradaService.newEntrada(nuevaEntrada).subscribe({
      next: (entradaCreada) => {
        console.log('Entrada creada exitosamente:', entradaCreada);
        this.snackBarExito('Entrada guardada correctamente');
        // location.reload();
        this.entradaSalidaForm.reset();
        this.entradaSalidaForm.setControl(
          'productos',
          this.fb.array([this.crearProductoFormGroup()])
        );
        this.resetForm();
      },
      error: (error) => {
        console.error('Error completo al crear la entrada:', error);
        this.snackBarError(error);
      },
    });
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
        next: (producto) => {
          if (producto) {
            descriptionControl!.setValue(producto.description);
            this.productosNuevos.delete(index); // Eliminar de productos nuevos si existe
          } else {
            descriptionControl!.setValue('');
            this.productosNuevos.add(index); // Añadir a productos nuevos
          }
        },
        error: () => {
          descriptionControl!.setValue('');
          this.productosNuevos.add(index); // Añadir a productos nuevos en caso de error
        },
      });
  }

  isProductoNuevo(index: number): boolean {
    return this.productosNuevos.has(index);
  }

  // Se llama al insertar el Excel
  indice = 0;
  buscarDescripcionProducto(formGroup: FormGroup, ref: String) {
    this.productoService.getProductoPorReferencia(ref).subscribe({
      next: (producto) => {
        if (producto == null) {
          this.productosNuevos.add(this.indice);
        }
        this.indice++;
        formGroup.get('description')?.setValue(producto.description);
      },
      error: (error) => {
        console.error('Error al buscar producto', error);
      },
    });
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
    this.ubicacionesService.getUbicacionesOrderByNombre().subscribe({
      next: (ubicaciones) => {
        this.ubicaciones = ubicaciones;
      },
      error: (error) => {
        console.error('Error al obtener ubicaciones', error);
      },
    })
  }

  desactivarBtnSubmit() {
    this.btnSubmitActivado = false;
    if (this.btnSubmitActivado) {
      console.log('El botón está activado');
    } else {
      console.log('El botón está desactivado');
    }
  }

}
