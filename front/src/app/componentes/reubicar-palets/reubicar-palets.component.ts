import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Entrada } from 'src/app/models/entrada.model';
import { Salida } from 'src/app/models/salida.model';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { ReubicarPaletsService } from 'src/app/services/reubicar-palets.service';
import { SnackBar } from 'src/app/services/snackBar.service';
import { UbicacionService } from 'src/app/services/ubicacion.service';

@Component({
  selector: 'app-reubicar-palets',
  templateUrl: './reubicar-palets.component.html',
  styleUrls: [
    '../formulario-entrada-salida/formulario-entrada-salida.component.css',
    './reubicar-palets.component.css', 
  ],
})
export class ReubicarPaletsComponent implements OnInit {
  entradaSalidaForm!: FormGroup;
  btnSubmitActivado: boolean = true;
  ubicaciones: String[] = [];
  paletsEnviados: number = 0;
  paletsRecibidos: number = 0;

  constructor(
    private reubicarService: ReubicarPaletsService,
    private ubicacionesService: UbicacionService,
    private snackbar: SnackBar,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.cargarUbicaciones();
    this.entradaSalidaForm = this.createForm();
    this.setCampoValue('fechaRecepcionEnvio', this.formatearFecha(new Date()));
    this.cargarNumeroPalets();
  }

  createForm() {
    return this.fb.group({
      fechaRecepcionEnvio: ['', [Validators.required]],
      tipoReubicacion: ['entrada', [Validators.required]],
      productos: this.fb.array([this.createProductoGroup()]),
    });
  }

  createProductoGroup(): FormGroup {
    return this.fb.group({
      ref: [''],
      description: [''],
      palets: [0, [Validators.required, Validators.min(0)]],
      bultos: [],
      unidadesPedidas: [],
      unidades: [],
      ubicacion: [''],
      formaEnvio: [''],
      observaciones: [''],
      comprobado: [true],
    });
  }

  get productosControls() {
    return this.entradaSalidaForm.get('productos') as FormArray;
  }

  addProducto() {
    this.productosControls.push(this.createProductoGroup());
  }

  eliminarProducto(index: number) {
    this.productosControls.removeAt(index);
  }

  onSubmit() {
    this.btnSubmitActivado = false;

    // Si no se ha seleccionado fecha de recepción/envío
    if (!this.entradaSalidaForm.get('fechaRecepcionEnvio')?.value) {
      this.snackbar.snackBarError('Debe seleccionar una fecha');
      this.btnSubmitActivado = true;
      return;
    }

    // Si no se ha introducido ningún producto
    if (this.productosControls.length === 0) {
      this.snackbar.snackBarError('Debe introducir al menos un producto');
      this.btnSubmitActivado = true;
      return;
    }

    // Si alguno de los productos tiene la cantidad de palets menor a 1 o no es un número
    let sinProductos = false;
    this.productosControls.controls.forEach((producto) => {
      if (producto.get('palets')?.value < 1 || isNaN(producto.get('palets')?.value)) {
        sinProductos = true;
      }
    });

    if(sinProductos) {
      this.snackbar.snackBarError('La cantidad de palets debe ser mayor a 0');
      this.btnSubmitActivado = true;
      return;
    }

    // Si el formulario es válido
    if (this.entradaSalidaForm.valid) {
      if (this.entradaSalidaForm.get('tipoReubicacion')?.value === 'salida') {
        this.crearSalida();
      } else {
        this.crearEntrada();
      }
    } else {
      this.snackbar.snackBarError('Formulario inválido');
      this.btnSubmitActivado = true;
    }

  }

  private crearSalida(){
    // Crear el objeto Salida
    const nuevaSalida: Salida = {
      destino: "REUBICACION DE PALETS",
      estado: true,
      productos: this.entradaSalidaForm.get('productos')?.value,
      rellena: true,
      fechaEnvio: this.entradaSalidaForm.get('fechaRecepcionEnvio')?.value,
    };

    this.reubicarService.reubicarPaletsSalida(nuevaSalida).subscribe({
      next: (salidaCreada) => {
        console.log('Salida creada exitosamente:', salidaCreada);
        this.snackbar.snackBarExito('Salida guardada correctamente');
        this.resetForm();
        this.btnSubmitActivado = true;
        this.setCampoValue(
          'fechaRecepcionEnvio',
          this.formatearFecha(new Date())
        );
      },
      error: (error) => {
        console.error(error);
        this.snackbar.snackBarError(error.error.message || error.error);
        this.btnSubmitActivado = true;
      },
    });
  }

  private crearEntrada(){
    // Crear el objeto Entrada
    const nuevaEntrada: Entrada = {
      origen: "REUBICACION DE PALETS",
      estado: true,
      productos: this.entradaSalidaForm.get('productos')?.value,
      rellena: true,
      fechaRecepcion: this.entradaSalidaForm.get('fechaRecepcionEnvio')?.value,
    };

    console.log('Entrada a crear:', nuevaEntrada);

    this.reubicarService.reubicarPaletsEntrada(nuevaEntrada).subscribe({
      next: (entradaCreada) => {
        console.log('Entrada creada exitosamente:', entradaCreada);
        this.snackbar.snackBarExito('Entrada guardada correctamente');
        this.resetForm();
        this.btnSubmitActivado = true;
        this.setCampoValue(
          'fechaRecepcionEnvio',
          this.formatearFecha(new Date())
        );
      },
      error: (error) => {
        console.error(error);
        this.snackbar.snackBarError(error.error.message || error.error);
        this.btnSubmitActivado = true;
      },
    });
  }

  // Resetear completamente el formulario
  resetForm() {
    if (this.entradaSalidaForm) {
      this.entradaSalidaForm.reset();
      this.entradaSalidaForm.setControl('productos', this.createProductoGroup());
    }
    this.entradaSalidaForm = this.createForm();
  }

  // Establecer valor individual
  setCampoValue(CampoName: string, value: any) {
    this.entradaSalidaForm.get(CampoName)?.setValue(value);
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

  cargarNumeroPalets() {
    this.reubicarService.getPaletsEnviados().subscribe(
      (data: number) => {
        this.paletsEnviados = data;
      }
    );

    this.reubicarService.getPaletsRecibidos().subscribe(
      (data: number) => {
        this.paletsRecibidos = data;
      }
    );
  }

}
