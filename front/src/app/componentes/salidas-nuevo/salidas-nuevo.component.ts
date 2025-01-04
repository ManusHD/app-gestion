import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { Salida } from 'src/app/models/salida.model';
import { ProductoSalida } from 'src/app/models/productoSalida.model';
import { SalidaServices } from 'src/app/services/salida.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { EMPTY, forkJoin, Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-salidas-nuevo',
  templateUrl: './salidas-nuevo.component.html',
  styleUrls: [
    '../detalles-salidas/detalles-salidas.component.css',
    './salidas-nuevo.component.css',
  ],
})
export class SalidasNuevoComponent {
  salidaForm!: FormGroup;
  pendiente: boolean = true;
  nNuevosProductos: number = 0;

  private snackBar = inject(MatSnackBar);

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoServices,
    private salidaService: SalidaServices
  ) {}

  ngOnInit() {
    // Inicializar el formulario con un producto
    this.salidaForm = this.fb.group({
      productos: this.fb.array([this.crearProductoFormGroup()]),
    });
  }

  // Getter para acceder fácilmente al FormArray de productos
  get productosControls() {
    return this.salidaForm.get('productos') as FormArray;
  }

  getEstadoCampo(nombreCampo: string, indexCampo: number) {
    const producto = this.productosControls.at(indexCampo);
    const campoVacio = producto.get(nombreCampo)!.invalid;

    let rellenoObligatorioVacio = false;
    const camposObligatorios = /^(numeroSalida|ref|description)$/;

    if (camposObligatorios.test(nombreCampo)) {
      rellenoObligatorioVacio = producto.get(nombreCampo)!.invalid;
    }

    if (nombreCampo == 'unidades' && producto.get(nombreCampo)!.value < 0) {
      return 'campo-vacio';
    }

    if (
      (campoVacio && !this.pendiente) ||
      (campoVacio && rellenoObligatorioVacio) || 
      (producto.get(nombreCampo)!.value < 0)
    ) {
      return 'campo-vacio';
    } else {
      return '';
    }
  }

  // Modificar el método crearProductoFormGroup
  crearProductoFormGroup(): FormGroup {
    return this.fb.group({
      numeroSalida: ['', Validators.required],
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
      fechaEnvio: [null, Validators.required],
      ubicacion: ['', Validators.required],
      palets: [0, [Validators.required, Validators.min(0)]],
      bultos: [1, [Validators.required, Validators.min(1)]],
      formaEnvio: ['', [Validators.required]],
    });
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

  // Método para añadir un nuevo producto
  agregarProducto() {
    const ultimoProducto = this.productosControls.at(
      this.productosControls.length - 1
    );
    const nuevoProducto = this.crearProductoFormGroup();

    // Copiar el número de salida del último producto
    const ultimoNumeroSalida = ultimoProducto.get('numeroSalida')!.value;
    nuevoProducto.get('numeroSalida')!.setValue(ultimoNumeroSalida);
    const ultimoFechaRecepcion = ultimoProducto.get('fechaEnvio')!.value;
    nuevoProducto.get('fechaEnvio')!.setValue(ultimoFechaRecepcion);
    const ultimoFormaEnvio = ultimoProducto.get('formaEnvio')!.value;
    nuevoProducto.get('formaEnvio')!.setValue(ultimoFormaEnvio);

    this.productosControls.push(nuevoProducto);
  }

  // Sincronizar número de salida en todas las filas
  sincronizarSalida() {
    const primerProducto = this.productosControls.at(0);
    const numeroSalida = primerProducto.get('numeroSalida')!.value;
    const fechaEnvio = primerProducto.get('fechaEnvio')!.value;
    const formaEnvio = primerProducto.get('formaEnvio')!.value;

    this.productosControls.controls.forEach((producto) => {
      producto.get('numeroSalida')!.setValue(numeroSalida);
      producto.get('fechaEnvio')!.setValue(fechaEnvio);
      producto.get('formaEnvio')!.setValue(formaEnvio);
    });
  }

  // Método para eliminar un producto
  eliminarProducto(index: number) {
    // No eliminar si solo queda un producto
    if (this.productosControls.length > 1) {
      this.productosControls.removeAt(index);
    }
  }

  // Buscar producto por referencia y autocompletar descripción
  // Modificar el método de búsqueda
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
          } else {
            descriptionControl!.setValue('');
          }
        },
        error: () => {
          descriptionControl!.setValue('');
        },
      });
  }

  // Método para guardar la salida de productos
  onSubmit() {
    let referenciasRellenas = true;
    let descriptionRellenas = true;
    let unidadesNegativas = false;
    let formatoValidoRef = false;

    // Obtener el número de salida del primer producto
    const numeroSalida = this.productosControls
      .at(0)
      .get('numeroSalida')!.value;

    // Transformar los productos del formulario a ProductoSalida
    const productosSalida: ProductoSalida[] =
      this.salidaForm.value.productos.map((producto: any) => {
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

        // Crear un nuevo objeto ProductoSalida
        return {
          dcs: producto.dcs,
          ref: producto.ref,
          description: producto.description,
          unidades: producto.unidades,
          ubicacion: producto.ubicacion,
          palets: producto.palets,
          bultos: producto.bultos,
        };
      });

    // Crear el objeto Salida
    const nuevaSalida: Salida = {
      destino: numeroSalida,
      estado: !this.pendiente,
      productos: productosSalida,
      fechaEnvio: this.productosControls.at(0).get('fechaEnvio')!.value,
      formaEnvio: this.productosControls.at(0).get('formaEnvio')!.value,
      rellena: false,
    };

    if (this.salidaForm.valid) {
      nuevaSalida.rellena = true;
      this.crearSalida(nuevaSalida);
    } else {
      if (
        this.pendiente &&
        numeroSalida != null &&
        numeroSalida != undefined &&
        numeroSalida != '' &&
        referenciasRellenas &&
        formatoValidoRef &&
        !unidadesNegativas &&
        descriptionRellenas
      ) {
        this.crearSalida(nuevaSalida);
      } else {
        // Marcar todos los campos como tocados para mostrar validaciones
        this.salidaForm.markAllAsTouched();
        console.log('Formulario inválido. Errores:', this.salidaForm.errors);
        if (!this.pendiente) {
          this.snackBarError(
            "Para 'Recibir' una salida deben estar todos los campos completos y correctos"
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
          this.snackBarError('Los productos no pueden tener unidades negativas');
        } else {
          this.snackBarError('El destino no puede estar en blanco');
        }
      }
    }
  }

  private crearSalida(nuevaSalida: Salida) {
    this.salidaService
      .newSalida(nuevaSalida)
      .pipe(
        catchError((error) => {
          this.snackBar.open(error.error || 'Error desconocido', '✖', {
            duration: 3000,
            panelClass: 'error',
          });
          return throwError(error);
        })
      )
      .subscribe(
        data => {
          console.log('Salida creada exitosamente:', data);
          this.salidaForm.reset();
          this.salidaForm.setControl(
            'productos',
            this.fb.array([this.crearProductoFormGroup()])
          );
          this.snackBar.open('Salida guardada correctamente', '✖', {
            duration: 3000,
            panelClass: 'exito',
          });
        }
      );
  }

  snackBarError(error: string) {
    this.snackBar.open(error, '✖', {
      duration: 3000,
      panelClass: 'error',
    });
  }

  // Resetear completamente el formulario
  resetForm() {
    this.salidaForm = this.fb.group({
      productos: this.fb.array([this.crearProductoFormGroup()]),
    });
  }

  //------------------------------------------------------
  //------------------ IMPORTAR EXCEL---------------------
  //------------------------------------------------------

  // Método para manejar la importación de archivos Excel
  onFileChange(event: any) {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const excelData = XLSX.utils.sheet_to_json(worksheet);
          console.log(excelData);

          // Limpiar el FormArray actual
          this.productosControls.clear();

          // Preparar los datos para agregar
          const productosParaAgregar = excelData.map((row: any) => {
            const productoFormGroup = this.crearProductoFormGroup();

            // Mapear los campos del Excel a los controles del formulario
            productoFormGroup.patchValue({
              numeroSalida: row.origen || row.destino,
              dcs: row.dcs,
              ref: row.ref,
              description: row.description,
              unidades: row.unidades,
              fechaEnvio: this.formatearFecha(row.fechaEnvio),
              ubicacion: row.ubicacion,
              palets: row.palets,
              bultos: row.bultos,
            });

            if (row.ref) {
              this.buscarDescripcionProducto(productoFormGroup, row.ref);
            }

            return productoFormGroup;
          });

          // Agregar los FormGroups al FormArray
          productosParaAgregar.forEach((formGroup) => {
            this.productosControls.push(formGroup);
          });

          // Mostrar mensaje de éxito
          this.snackBar.open('Excel importado correctamente', '✖', {
            duration: 3000,
            panelClass: 'exito',
          });

          event.target.value = '';
          this.sincronizarSalida();
        } catch (error) {
          console.error('Error procesando Excel:', error);
          this.snackBar.open('Error al procesar el archivo Excel', '✖', {
            duration: 3000,
            panelClass: 'error',
          });
        }
      };

      reader.readAsBinaryString(file);
    }
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

  buscarDescripcionProducto(formGroup: FormGroup, ref: String) {
    this.productoService.getProductoPorReferencia(ref).subscribe({
      next: (producto) => {
        formGroup.get('description')?.setValue(producto.description);
      },
      error: (error) => {
        console.error('Error al buscar producto', error);
        formGroup.get('description')?.setValue('');
      },
    });
  }
}
