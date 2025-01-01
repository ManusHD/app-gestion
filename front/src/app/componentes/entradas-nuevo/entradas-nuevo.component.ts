import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { Entrada } from 'src/app/models/entrada.model';
import { ProductoEntrada } from 'src/app/models/productoEntrada.model';
import { EntradaServices } from 'src/app/services/entrada.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { EMPTY, forkJoin, Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-entradas-nuevo',
  templateUrl: './entradas-nuevo.component.html',
  styleUrls: [
    '../detalles-entradas/detalles-entradas.component.css',
    './entradas-nuevo.component.css',
  ],
})
export class EntradasNuevoComponent {
  entradaForm!: FormGroup;
  pendiente: boolean = true;
  nNuevosProductos: number = 0;

  private snackBar = inject(MatSnackBar);

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoServices,
    private entradaService: EntradaServices
  ) {}

  ngOnInit() {
    // Inicializar el formulario con un producto
    this.entradaForm = this.fb.group({
      productos: this.fb.array([this.crearProductoFormGroup()]),
    });
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
      palets: [0, [Validators.required, Validators.min(0)]],
      bultos: [1, [Validators.required, Validators.min(1)]],
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

    // Copiar el número de entrada del último producto
    const ultimoNumeroEntrada = ultimoProducto.get('numeroEntrada')!.value;
    nuevoProducto.get('numeroEntrada')!.setValue(ultimoNumeroEntrada);
    const ultimoFechaRecepcion = ultimoProducto.get('fechaRecepcion')!.value;
    nuevoProducto.get('fechaRecepcion')!.setValue(ultimoFechaRecepcion);

    this.productosControls.push(nuevoProducto);
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

        if(producto.unidades < 0) {
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
    } else {
      if (this.pendiente && numeroEntrada != null && numeroEntrada != undefined && numeroEntrada != '' && referenciasRellenas && formatoValidoRef && descriptionRellenas && !unidadesNegativas) {
        this.crearEntrada(nuevaEntrada);
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
          this.snackBarError('Los productos no pueden tener unidades negativas');
        } else {
          this.snackBarError('El origen no puede estar en blanco');
        }
      }
    }
  }

  private crearEntrada(nuevaEntrada: Entrada) {
    this.entradaService.newEntrada(nuevaEntrada).subscribe({
      next: (entradaCreada) => {
        console.log('Entrada creada exitosamente:', entradaCreada);
        this.entradaForm.reset();
        this.entradaForm.setControl(
          'productos',
          this.fb.array([this.crearProductoFormGroup()])
        );
        this.snackBar.open('Entrada guardada correctamente', '✖', {
          duration: 3000,
          panelClass: 'exito',
        });
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

  // Resetear completamente el formulario
  resetForm() {
    this.entradaForm = this.fb.group({
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
              numeroEntrada: row.origen,
              dcs: row.dcs,
              ref: row.ref,
              description: row.description,
              unidades: row.unidades,
              fechaRecepcion: this.formatearFecha(row.fechaRecepcion),
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
          this.sincronizarEntrada();
          
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
