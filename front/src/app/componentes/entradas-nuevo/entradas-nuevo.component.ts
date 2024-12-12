import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { Entrada } from 'src/app/models/entrada.model';
import { ProductoEntrada } from 'src/app/models/productoEntrada.model';
import { EntradaServices } from 'src/app/services/entrada.service';
import { ProductoService } from 'src/app/services/producto.service';

@Component({
  selector: 'app-entradas-nuevo',
  templateUrl: './entradas-nuevo.component.html',
  styleUrls: [
    './entradas-nuevo.component.css',
    '../detalles-entradas/detalles-entradas.component.css',
  ],
})
export class EntradasNuevoComponent {
  entradaForm!: FormGroup;
  crearMano: boolean = false;
  importarExcel: boolean = false;

  private snackBar = inject(MatSnackBar);

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
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

  // Crear un FormGroup para cada producto
  crearProductoFormGroup(): FormGroup {
    return this.fb.group({
      numeroEntrada: ['', Validators.required],
      dcs: [''],
      ref: ['', Validators.required],
      description: ['', Validators.required],
      unidades: [0, [Validators.required, Validators.min(1)]],
      fechaRecepcion: [null, Validators.required],
      ubicacion: ['', Validators.required],
      palets: [0, [Validators.required, Validators.min(0)]],
      bultos: [1, [Validators.required, Validators.min(1)]],
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
  buscarProductoPorReferencia(index: number) {
    const refControl = this.productosControls.at(index).get('ref');
    const descriptionControl = this.productosControls
      .at(index)
      .get('description');

    if (refControl!.value) {
      this.productoService
        .getProductoPorReferencia(refControl!.value)
        .subscribe({
          next: (producto) => {
            descriptionControl!.setValue(producto.description);
          },
          error: (error) => {
            console.error('Error al buscar producto', error);
            descriptionControl!.setValue('');
          },
        });
    }
  }

  // Método para guardar la entrada de productos
  onSubmit() {
    if (this.entradaForm.valid) {
      // Obtener el número de entrada del primer producto
      const numeroEntrada = this.productosControls
        .at(0)
        .get('numeroEntrada')!.value;

      // Transformar los productos del formulario a ProductoEntrada
      const productosEntrada: ProductoEntrada[] =
        this.entradaForm.value.productos.map((producto: any) => {
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
        estado: true,
        productos: productosEntrada,
        rellena: true,
      };

      // Llamar al servicio para crear la entrada
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
          let errorMessage = 'Error desconocido';

          // Manejo más detallado del error
          if (error.error instanceof ErrorEvent) {
            // Error del lado del cliente
            errorMessage = error.error.message;
          } else {
            // Error del lado del servidor
            errorMessage =
              error.error?.message ||
              error.message ||
              'Error al crear la entrada';
          }

          this.snackBar.open(errorMessage, '✖', {
            duration: 3000,
            panelClass: 'error',
          });
        },
      });
    } else {
      // Marcar todos los campos como tocados para mostrar validaciones
      this.entradaForm.markAllAsTouched();
      console.log('Formulario inválido. Errores:', this.entradaForm.errors);
      this.snackBar.open('Faltan datos por rellenar', '✖', {
        duration: 3000,
        panelClass: 'error',
      });
    }
  }

  // Método para cambiar a creación manual
  changeAMano() {
    // Resetear completamente el formulario
    this.entradaForm = this.fb.group({
      productos: this.fb.array([this.crearProductoFormGroup()]),
    });

    // Reiniciar flags
    this.crearMano = !this.crearMano;
    this.importarExcel = false;
  }

  //------------------------------------------------------

  // Método para manejar la importación de archivos Excel
  onFileChange(event: any) {
    const file = event.target.files[0];

    if (file) {
      // Leer el archivo Excel
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const excelData = XLSX.utils.sheet_to_json(worksheet);

          // Limpiar el FormArray actual
          this.productosControls.clear();

          // Crear FormGroups para cada fila de Excel
          excelData.forEach((row: any) => {
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

            // Buscar descripción del producto si se proporciona referencia
            if (row.ref) {
              this.buscarDescripcionProducto(productoFormGroup, row.ref);
            }

            // Agregar el FormGroup al FormArray
            this.productosControls.push(productoFormGroup);
          });

          // Mostrar la tabla de importación
          this.crearMano = true;
          this.importarExcel = true;

          // Mostrar mensaje de éxito
          this.snackBar.open('Excel importado correctamente', '✖', {
            duration: 3000,
            panelClass: 'exito',
          });
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

  buscarDescripcionProducto(formGroup: FormGroup, ref: number) {
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
