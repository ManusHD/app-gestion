import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { Trabajo } from 'src/app/models/trabajo.model';
import { PDV } from 'src/app/models/pdv.model';
import { Colaborador } from 'src/app/models/colaborador.model';
import { Perfumeria } from 'src/app/models/perfumeria.model';
import { OtraDireccion } from 'src/app/models/otraDireccion.model';
import { TrabajoService } from 'src/app/services/trabajo.service';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';

@Component({
  selector: 'app-formulario-trabajo',
  templateUrl: './formulario-trabajo.component.html',
  styleUrls: ['./formulario-trabajo.component.css'],
})
export class FormularioTrabajoComponent implements OnInit {
  @Input() pestanaPadre: String = '';
  @Input() detallesTrabajo?: Trabajo = undefined;
  
  trabajoForm!: FormGroup;
  mostrarFormulario: boolean = false;
  btnSubmitActivado = true;
  
  perfumerias: Perfumeria[] = [];
  pdvs: PDV[] = [];
  colaboradores: Colaborador[] = [];
  otrasDirecciones: OtraDireccion[] = [];
  
  otraDireccionSeleccionada: OtraDireccion | null = null;
  perfumeriaSeleccionada: Perfumeria | null = null;
  pdvSeleccionado: PDV | null = null;
  colaboradorSeleccionado: Colaborador | null = null;
  
  activeCampoUnico: string | null = null;
  pageSize = 10;
  pageIndex = 0;
  
  private snackBar = inject(MatSnackBar);

  constructor(
    private fb: FormBuilder,
    private trabajoService: TrabajoService,
    private direccionesService: DireccionesService,
    private carga: PantallaCargaService
  ) {}

  ngOnInit() {
    this.trabajoForm = this.createForm();
    this.cargarDirecciones();
    
    if (!this.detallesTrabajo) {
      this.inicializarNuevoTrabajo();
    } else {
      this.inicializarDetalleTrabajo();
    }
    
    this.setupFormSubscriptions();
  }

  createForm(): FormGroup {
    return this.fb.group({
      fecha: ['', Validators.required],
      concepto: ['', Validators.required],
      perfumeria: [''],
      pdv: [''],
      otroOrigen: [''],
      direccion: [''],
      poblacion: [''],
      provincia: [''],
      cp: [''],
      telefono: [''],
      horas: ['', [Validators.required, Validators.min(0.1)]],
      importePorHora: [25, [Validators.required, Validators.min(0)]],
      importeTotal: [{ value: 0, disabled: true }],
      observaciones: ['']
    });
  }

  private setupFormSubscriptions() {
    // Suscripción para calcular importe automáticamente
    this.trabajoForm.get('horas')?.valueChanges.subscribe(() => {
      this.calcularImporteTotal();
    });
    
    this.trabajoForm.get('importePorHora')?.valueChanges.subscribe(() => {
      this.calcularImporteTotal();
    });

    // Suscripciones para autocompletado
    this.trabajoForm.get('perfumeria')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe((value) => {
      if (value == '' || value == null) {
        this.limpiarCamposDireccion();
        this.trabajoForm.get('pdv')!.setValue('');
        this.pdvs = [];
        this.perfumeriaSeleccionada = null;
        this.pdvSeleccionado = null;
        this.cargarPerfumerias('a');
      } else {
        this.cargarPerfumerias(value);
      }
    });

    this.trabajoForm.get('pdv')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe((value) => {
      const nombrePerfumeria = this.trabajoForm.get('perfumeria')?.value;
      if (value == '' || value == null) {
        this.limpiarCamposDireccion();
        this.pdvSeleccionado = null;
        if (nombrePerfumeria) {
          this.cargarPDVs();
        }
      } else {
        this.cargarPDVsPerfumeriaByNombre(nombrePerfumeria, value);
      }
    });

    this.trabajoForm.get('otroOrigen')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe((value) => {
      if (value == '' || value == null) {
        this.limpiarCamposDireccion();
        this.otraDireccionSeleccionada = null;
        this.cargarOtrasDirecciones('a');
      } else {
        this.cargarOtrasDirecciones(value);
      }
    });

    // Rellenar dirección automáticamente
    this.trabajoForm.get('pdv')?.valueChanges.subscribe((value) => {
      if (value) {
        this.rellenarDireccionPDV(value);
      }
    });
  }

  private cargarDirecciones() {
    this.cargarPerfumerias('a');
    this.cargarOtrasDirecciones('a');
  }

  private inicializarNuevoTrabajo() {
    this.mostrarFormulario = true;
    this.trabajoForm.patchValue({
      fecha: new Date().toISOString().split('T')[0],
      importePorHora: 25
    });
  }

  private inicializarDetalleTrabajo() {
    this.mostrarFormulario = true;
    if (this.detallesTrabajo) {
      this.trabajoForm.patchValue({
        fecha: this.formatearFecha(this.detallesTrabajo.fecha),
        concepto: this.detallesTrabajo.concepto,
        perfumeria: this.detallesTrabajo.perfumeria,
        pdv: this.detallesTrabajo.pdv,
        otroOrigen: this.detallesTrabajo.otroOrigen,
        direccion: this.detallesTrabajo.direccion,
        poblacion: this.detallesTrabajo.poblacion,
        provincia: this.detallesTrabajo.provincia,
        cp: this.detallesTrabajo.cp,
        telefono: this.detallesTrabajo.telefono,
        horas: this.detallesTrabajo.horas,
        importePorHora: this.detallesTrabajo.importePorHora,
        importeTotal: this.detallesTrabajo.importeTotal,
        observaciones: this.detallesTrabajo.observaciones
      });
    }
  }

  calcularImporteTotal() {
    const horas = this.trabajoForm.get('horas')?.value || 0;
    const importePorHora = this.trabajoForm.get('importePorHora')?.value || 0;
    const total = horas * importePorHora;
    this.trabajoForm.get('importeTotal')?.setValue(total.toFixed(2));
  }

  onSubmit() {
    this.carga.show();
    this.btnSubmitActivado = false;
    
    if (this.trabajoForm.valid && this.validarDirecciones()) {
      const nuevoTrabajo: Trabajo = {
        fecha: this.trabajoForm.get('fecha')?.value,
        concepto: this.trabajoForm.get('concepto')?.value,
        perfumeria: this.trabajoForm.get('perfumeria')?.value,
        pdv: this.trabajoForm.get('pdv')?.value,
        otroOrigen: this.trabajoForm.get('otroOrigen')?.value,
        direccion: this.trabajoForm.get('direccion')?.value,
        poblacion: this.trabajoForm.get('poblacion')?.value,
        provincia: this.trabajoForm.get('provincia')?.value,
        cp: this.trabajoForm.get('cp')?.value,
        telefono: this.trabajoForm.get('telefono')?.value,
        horas: this.trabajoForm.get('horas')?.value,
        importePorHora: this.trabajoForm.get('importePorHora')?.value,
        observaciones: this.trabajoForm.get('observaciones')?.value,
        estado: false
      };

      this.trabajoService.newTrabajo(nuevoTrabajo).subscribe({
        next: (trabajoCreado) => {
          console.log('Trabajo creado exitosamente:', trabajoCreado);
          this.snackBarExito('Trabajo guardado correctamente');
          this.resetForm();
          this.carga.hide();
          this.btnSubmitActivado = true;
        },
        error: (error) => {
          console.error('Error al crear el trabajo:', error);
          this.snackBarError(error.error || 'Error al crear el trabajo');
          this.carga.hide();
          this.btnSubmitActivado = true;
        }
      });
    } else {
      this.marcarCamposInvalidos();
      this.carga.hide();
      this.btnSubmitActivado = true;
    }
  }

  modificarTrabajo() {
    this.carga.show();
    
    if (this.trabajoForm.valid && this.validarDirecciones()) {
      const trabajoActualizado: Trabajo = {
        id: this.detallesTrabajo?.id,
        fecha: this.trabajoForm.get('fecha')?.value,
        concepto: this.trabajoForm.get('concepto')?.value,
        perfumeria: this.trabajoForm.get('perfumeria')?.value,
        pdv: this.trabajoForm.get('pdv')?.value,
        otroOrigen: this.trabajoForm.get('otroOrigen')?.value,
        direccion: this.trabajoForm.get('direccion')?.value,
        poblacion: this.trabajoForm.get('poblacion')?.value,
        provincia: this.trabajoForm.get('provincia')?.value,
        cp: this.trabajoForm.get('cp')?.value,
        telefono: this.trabajoForm.get('telefono')?.value,
        horas: this.trabajoForm.get('horas')?.value,
        importePorHora: this.trabajoForm.get('importePorHora')?.value,
        observaciones: this.trabajoForm.get('observaciones')?.value,
        estado: this.detallesTrabajo?.estado || false
      };

      this.trabajoService.updateTrabajo(trabajoActualizado).subscribe({
        next: (updatedTrabajo) => {
          console.log('Trabajo actualizado:', updatedTrabajo);
          location.reload();
          this.snackBarExito('Trabajo actualizado exitosamente');
        },
        error: (err) => {
          console.error('Error al actualizar el trabajo:', err);
          this.snackBarError('Error al actualizar el trabajo');
          this.carga.hide();
        }
      });
    } else {
      this.marcarCamposInvalidos();
      this.carga.hide();
    }
  }

  private validarDirecciones(): boolean {
    const perfumeria = this.trabajoForm.get('perfumeria')?.value;
    const pdv = this.trabajoForm.get('pdv')?.value;
    const otroOrigen = this.trabajoForm.get('otroOrigen')?.value;

    const tienePerfumeriaPdv = perfumeria && pdv;
    const tieneOtroOrigen = otroOrigen && otroOrigen.trim() !== '';

    if (!tienePerfumeriaPdv && !tieneOtroOrigen) {
      this.snackBarError('Debe especificar una dirección (Perfumería + PDV o Otro Origen)');
      return false;
    }

    return true;
  }

  private resetForm() {
    this.trabajoForm.reset();
    this.trabajoForm.patchValue({
      fecha: new Date().toISOString().split('T')[0],
      importePorHora: 25
    });
  }

  // Métodos de validación y utilidades
  campoSimpleVacio(nombreCampo: string): boolean {
    if(!this.trabajoForm.get(nombreCampo)!.valid &&
      this.trabajoForm.get(nombreCampo)!.touched  ) {
      return true;
    }
    return false;
  }

  perfumeriaValido() {
    const perfumeria = this.trabajoForm.get('perfumeria')?.value;
    const pdv = this.trabajoForm.get('pdv')?.value;

    if ((pdv && !perfumeria) || (!pdv && perfumeria)) {
      return true;
    }
    return false;
  }

  pdvValido() {
    const perfumeria = this.trabajoForm.get('perfumeria')?.value;
    const pdv = this.trabajoForm.get('pdv')?.value;

    if ((pdv && !perfumeria) || (!pdv && perfumeria)) {
      return true;
    }
    return false;
  }

  otroOrigenValido(): boolean {
    return this.trabajoForm.get('otroOrigen')?.valid || false;
  }

  previsionEsValidaCampoSimple(): boolean {
    const perfumeria = this.trabajoForm.get('perfumeria')?.value;
    const pdv = this.trabajoForm.get('pdv')?.value;
    const otroOrigen = this.trabajoForm.get('otroOrigen')?.value;

    const tienePerfumeriaPdv = perfumeria && pdv;
    const tieneOtroOrigen = otroOrigen && otroOrigen.trim() !== '';

    return tienePerfumeriaPdv || tieneOtroOrigen;
  }

  private marcarCamposInvalidos() {
    Object.keys(this.trabajoForm.controls).forEach((key) => {
      const control = this.trabajoForm.get(key);
      control?.markAsTouched();
    });
  }

  private formatearFecha(fecha: any): string | null {
    if (!fecha) return null;
    if (fecha instanceof Date || typeof fecha === 'string') {
      return new Date(fecha).toISOString().split('T')[0];
    }
    return null;
  }

  // Métodos para autocompletado (similar a formulario-entrada-salida)
  cargarPerfumerias(perfumeria: string) {
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

  cargarPDVs(): Promise<void> {
    const perfumeria = this.trabajoForm.get('perfumeria')?.value;
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

  cargarPDVsPerfumeriaByNombre(nombrePerfumeria: string, nombrePdv: string) {
    this.direccionesService
      .getPDVsDeUnaPerfumeriaByNombres(nombrePerfumeria, nombrePdv)
      .subscribe((data: PDV[]) => {
        this.pdvs = data;
      });
  }

  cargarOtrasDirecciones(direccion: string) {
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

  // Métodos de selección para autocompletado
  selectPerfumeria(perfumeria: Perfumeria) {
    this.trabajoForm.patchValue({
      perfumeria: perfumeria.nombre,
      otroOrigen: ''
    });

    this.perfumeriaSeleccionada = perfumeria;
    this.cargarPDVPerfumeria(perfumeria.nombre!);
    this.activeCampoUnico = null;
    this.perfumerias = [];
  }

  selectPdv(pdv: PDV) {
    this.trabajoForm.patchValue({
      pdv: pdv.nombre,
      otroOrigen: ''
    });

    this.pdvSeleccionado = pdv;
    this.activeCampoUnico = null;
    this.pdvs = [];
  }

  selectOtraDireccion(direccion: OtraDireccion) {
    this.trabajoForm.patchValue({
      otroOrigen: direccion.nombre,
      perfumeria: '',
      pdv: ''
    });

    this.rellenarDireccionOtraDireccion(direccion);
    this.otraDireccionSeleccionada = direccion;
    this.activeCampoUnico = null;
    this.otrasDirecciones = [];
  }

  cargarPDVPerfumeria(perfumeria: string) {
    this.direccionesService
      .getPdvsPerfumeria(perfumeria)
      .subscribe((data: PDV[]) => {
        this.pdvs = data;
      });
  }

  // Métodos para rellenar direcciones automáticamente
  private rellenarDireccionPDV(nombrePDV: string) {
    const pdvSeleccionado = this.pdvs.find((pdv) => pdv.nombre === nombrePDV);
    if (pdvSeleccionado) {
      this.trabajoForm.patchValue({
        direccion: pdvSeleccionado.direccion || '',
        poblacion: pdvSeleccionado.poblacion || '',
        provincia: pdvSeleccionado.provincia || '',
        cp: pdvSeleccionado.cp || '',
        telefono: pdvSeleccionado.telefono || '',
      });
    }
  }

  private rellenarDireccionOtraDireccion(direccion: OtraDireccion) {
    this.trabajoForm.patchValue({
      direccion: direccion.direccion || '',
      poblacion: direccion.poblacion || '',
      provincia: direccion.provincia || '',
      cp: direccion.cp || '',
      telefono: direccion.telefono || '',
    });
  }

  private limpiarCamposDireccion() {
    const otroOrigen = this.trabajoForm.get('otroOrigen')?.value;
    const pdv = this.trabajoForm.get('pdv')?.value;

    if (!otroOrigen && !pdv) {
      this.trabajoForm.patchValue({
        direccion: '',
        poblacion: '',
        provincia: '',
        cp: '',
        telefono: '',
      });
    }
  }

  // Métodos para manejar el autocompletado
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
        this.activeCampoUnico === 'otroOrigen' &&
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
  }

  private focusNextElement(currentElement: HTMLElement): void {
    const inputs = Array.from(
      document.querySelectorAll<HTMLElement>('input, select, textarea, button')
    );
    const index = inputs.indexOf(currentElement);

    if (index >= 0 && index < inputs.length - 1) {
      const nextElement = inputs[index + 1];
      nextElement.focus();
    }
  }

  // Métodos de utilidad para mensajes
  private snackBarError(error: string) {
    this.snackBar.open(error, '✖', {
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