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

@Injectable()
export class FormularioEntradaSalidaService {
  entradaForm!: FormGroup;
  pendiente: boolean = true;
  productosNuevos: Set<number> = new Set();
  btnSubmitActivado: boolean = true;
  mostrarFormulario = false;

  private snackBar = inject(MatSnackBar);

  constructor(
    protected fb: FormBuilder,
    protected productoService: ProductoServices,
    protected entradaService: EntradaServices,
    public entradasFormService: EntradaServices
  ) {}

  initForm() {
    return this.fb.group({
      productos: this.fb.array([this.crearProductoFormGroup()]),
    });
  }

  desactivarBtnSubmit() {
    this.btnSubmitActivado = false;
  }

  // Getter para acceder fácilmente al FormArray de productos
  get productosControls() {
    return this.entradaForm.get('productos') as FormArray;
  }

  getEstadoCampo(nombreCampo: string, indexCampo: number) {
    const producto = this.productosControls.at(indexCampo);
    const campoVacio = producto.get(nombreCampo)!.invalid;

    let rellenoObligatorioVacio = false;
    const camposObligatorios = /^(numeroEntrada|ref|description)$/;

    if (camposObligatorios.test(nombreCampo)) {
      rellenoObligatorioVacio = producto.get(nombreCampo)!.invalid;
    }

    if (nombreCampo == 'unidades' && producto.get(nombreCampo)!.value < 0) {
      return 'campo-vacio';
    }

    if (
      (campoVacio && !this.pendiente) ||
      (campoVacio && rellenoObligatorioVacio)
    ) {
      return 'campo-vacio';
    } else {
      return '';
    }
  }

  // Modificar el método crearProductoFormGroup
  crearProductoFormGroup(): FormGroup {
    return this.fb.group({
      numeroEntrada: ['', Validators.required],
      dcs: ['', [Validators.max(9999999999)]],
      ref: [
        '',
        {
          validators: [
            Validators.required,
            Validators.minLength(7),
            Validators.maxLength(8),
          ],
          asyncValidators: [this.referenciaValidator.bind(this)],
          updateOn: 'blur',
        },
      ],
      description: ['', Validators.required],
      unidades: [1, [Validators.required, Validators.min(1)]],
      fechaRecepcion: [null, Validators.required],
      ubicacion: ['', Validators.required],
      palets: ['', [Validators.required, Validators.min(0)]],
      bultos: [0, [Validators.required, Validators.min(0)]],
    });
  }

  // Método para añadir un nuevo producto
  agregarProducto() {
    const ultimoProducto = this.productosControls.at(
      this.productosControls.length - 1
    );
    const nuevoProducto = this.crearProductoFormGroup();

    // Copiar el número de entrada del último producto
    const ultimoNumeroEntrada = ultimoProducto.get('numeroEntrada')!.value;
    nuevoProducto.get('numeroEntrada')!.setValue(ultimoNumeroEntrada);
    const ultimoFechaRecepcion = ultimoProducto.get('fechaRecepcion')!.value;
    nuevoProducto.get('fechaRecepcion')!.setValue(ultimoFechaRecepcion);

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
    this.entradaForm = this.fb.group({
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
        this.snackBarError('Error al validar la referencia.');
        return of({ referenciaInvalida: true });
      })
    );
  }

  // Sincronizar número de entrada en todas las filas
  sincronizarEntrada() {
    const primerProducto = this.productosControls.at(0);
    const numeroEntrada = primerProducto.get('numeroEntrada')!.value;
    const fechaRecepcion = primerProducto.get('fechaRecepcion')!.value;

    this.productosControls.controls.forEach((producto) => {
      producto.get('numeroEntrada')!.setValue(numeroEntrada);
      producto.get('fechaRecepcion')!.setValue(fechaRecepcion);
    });
  }

  // Método para guardar la entrada de productos
  onSubmit() {
    let referenciasRellenas = true;
    let descriptionRellenas = true;
    let formatoValidoRef = false;
    let unidadesNegativas = false;

    // Obtener el número de entrada del primer producto
    const numeroEntrada = this.productosControls
      .at(0)
      .get('numeroEntrada')!.value;

    // Transformar los productos del formulario a ProductoEntrada
    const productosEntrada: ProductoEntrada[] =
      this.entradaForm.value.productos.map((producto: any) => {
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
          fechaRecepcion: producto.fechaRecepcion
            ? new Date(producto.fechaRecepcion)
            : undefined,
          ubicacion: producto.ubicacion,
          palets: producto.palets,
          bultos: producto.bultos,
        };
      });

    // Crear el objeto Entrada
    const nuevaEntrada: Entrada = {
      origen: numeroEntrada,
      estado: !this.pendiente,
      productos: productosEntrada,
      rellena: false,
    };

    if (this.entradaForm.valid) {
      nuevaEntrada.rellena = true;
      this.crearEntrada(nuevaEntrada);
      location.reload();
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
        location.reload();
      } else {
        // Marcar todos los campos como tocados para mostrar validaciones
        this.entradaForm.markAllAsTouched();
        console.log('Formulario inválido. Errores:', this.entradaForm.errors);
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

  private crearObjetoEntrada() {}

  private crearEntrada(nuevaEntrada: Entrada) {
    this.entradaService.newEntrada(nuevaEntrada).subscribe({
      next: (entradaCreada) => {
        console.log('Entrada creada exitosamente:', entradaCreada);
        this.entradaForm.reset();
        this.entradaForm.setControl(
          'productos',
          this.fb.array([this.crearProductoFormGroup()])
        );
        this.snackBarExito('Entrada guardada correctamente');
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
}
