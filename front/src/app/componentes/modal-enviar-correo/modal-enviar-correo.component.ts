import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CorreoService } from 'src/app/services/correo.service';
import { PlantillaCorreo } from 'src/app/models/plantilla-correo.model';
import {
  EnviarCorreoRequest,
  ImagenBase64,
} from 'src/app/models/enviar-correo-request.model';
import { Salida } from 'src/app/models/salida.model';
import { SnackBar } from 'src/app/services/snackBar.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { Colaborador } from 'src/app/models/colaborador.model';

@Component({
  selector: 'app-modal-enviar-correo',
  templateUrl: './modal-enviar-correo.component.html',
  styleUrls: [
    '../../../assets/styles/modal.css',
    './modal-enviar-correo.component.css',
  ],
})
export class ModalEnviarCorreoComponent implements OnInit {
  mostrarModal: boolean = false;
  formCorreo!: FormGroup;
  plantillas: PlantillaCorreo[] = [];
  plantillaSeleccionada: PlantillaCorreo | null = null;
  imagenesUrls: string[] = [];
  imagenesBase64: ImagenBase64[] = [];
  mostrarVistaPrevia = false;
  @Input() salida!: Salida;
  colaborador: Colaborador = new Colaborador();

  constructor(
    private fb: FormBuilder,
    private correoService: CorreoService,
    private snackBar: SnackBar,
    private carga: PantallaCargaService,
    private direccionesService: DireccionesService
  ) {}

  ngOnInit(): void {
    this.cargarPlantillas();
    this.initForm();
  }

  initForm(): void {
    const destinoNombre =
      this.salida.colaborador || this.salida.pdv || this.salida.destino;
    this.direccionesService.getColaborador(this.salida.colaborador!).subscribe({
      next: (colaborador: Colaborador) => {
        this.colaborador = colaborador;
        this.formCorreo = this.fb.group({
          plantillaId: [''],
          destinatario: [
            colaborador.email,
            [Validators.required, Validators.email],
          ],
          asunto: [
            `Notificación de envío - ${destinoNombre}`,
            Validators.required,
          ],
          cuerpo: [this.generarCuerpoDefault(), Validators.required],
        });
      },
    });
  }

  cargarPlantillas(): void {
    this.correoService.getPlantillasActivas().subscribe({
      next: (plantillas) => {
        this.plantillas = plantillas;
      },
      error: (error) => {
        console.error('Error al cargar plantillas:', error);
      },
    });
  }

  onPlantillaChange(): void {
    const plantillaId = this.formCorreo.get('plantillaId')?.value;
    if (!plantillaId) return;

    this.plantillaSeleccionada =
      this.plantillas.find((p) => p.id == plantillaId) || null;

    if (this.plantillaSeleccionada) {
      const cuerpoConVariables = this.reemplazarVariables(
        this.plantillaSeleccionada.cuerpo || ''
      );
      const asuntoConVariables = this.reemplazarVariables(
        this.plantillaSeleccionada.asunto || ''
      );

      this.formCorreo.patchValue({
        asunto: asuntoConVariables,
        cuerpo: cuerpoConVariables,
      });
    }
  }

  reemplazarVariables(texto: string): string {
    const salida = this.salida;

    return texto
      .replace(
        /{nombreColaborador}/g,
        salida.colaborador || salida.pdv || salida.destino || ''
      )
      .replace(/{direccion}/g, salida.direccion || '')
      .replace(/{poblacion}/g, salida.poblacion || '')
      .replace(/{provincia}/g, salida.provincia || '')
      .replace(/{cp}/g, salida.cp || '')
      .replace(
        /{fechaEnvio}/g,
        salida.fechaEnvio
          ? new Date(salida.fechaEnvio).toLocaleDateString('es-ES')
          : ''
      )
      .replace(/{telefono}/g, salida.telefono || '')
      .replace(/{productos}/g, this.generarListaProductos());
  }

  generarCuerpoDefault(): string {
    const salida = this.salida;
    const destinoNombre = salida.colaborador || salida.pdv || salida.destino;

    return `Estimado/a ${destinoNombre},

Le informamos que su envío ha sido preparado y está listo para su despacho.

Detalles del envío:
${this.generarListaProductosTexto()}

Dirección de envío:
${salida.direccion || ''}
${salida.cp || ''} - ${salida.poblacion || ''} (${salida.provincia || ''})

Saludos cordiales,
Equipo DELIM`;
  }

  generarListaProductos(): string {
    if (!this.salida.productos || this.salida.productos.length === 0) {
      return 'No hay productos en este envío.';
    }

    let lista = '';
    this.salida.productos.forEach((producto) => {
      lista += `- ${producto.ref} - ${producto.description}: ${producto.unidades} unidades\n`;
    });

    return lista;
  }

  generarListaProductosTexto(): string {
    if (!this.salida.productos || this.salida.productos.length === 0) {
      return 'No hay productos en este envío.';
    }

    let texto = '';
    this.salida.productos.forEach((producto) => {
      texto += `- ${producto.ref} - ${producto.description}: ${producto.unidades} unidades\n`;
    });

    return texto;
  }

  agregarImagenUrl(): void {
    const url = prompt('Ingrese la URL de la imagen:');
    if (url && url.trim() !== '') {
      this.imagenesUrls.push(url.trim());
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        this.snackBar.snackBarError('Solo se permiten archivos de imagen');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.imagenesBase64.push({
          nombre: file.name,
          contenidoBase64: base64,
          contentType: file.type,
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    input.value = '';
  }

  eliminarImagen(index: number): void {
    this.imagenesUrls.splice(index, 1);
  }

  eliminarImagenBase64(index: number): void {
    this.imagenesBase64.splice(index, 1);
  }

  toggleVistaPrevia(): void {
    this.mostrarVistaPrevia = !this.mostrarVistaPrevia;
  }

  getVistaPrevia(): string {
    return this.formCorreo.get('cuerpo')?.value.replace(/\n/g, '<br>') || '';
  }

  enviarCorreo(): void {
    if (this.formCorreo.invalid) {
      this.snackBar.snackBarError(
        'Por favor complete todos los campos requeridos'
      );
      return;
    }
    this.carga.show();

    const request: EnviarCorreoRequest = {
      destinatario: this.formCorreo.get('destinatario')?.value,
      asunto: this.formCorreo.get('asunto')?.value,
      cuerpo: this.formCorreo.get('cuerpo')?.value,
      salidaId: this.salida.id,
      colaboradorNombre: this.salida.colaborador,
      imagenesUrls: this.imagenesUrls,
      imagenesBase64: this.imagenesBase64,
    };

    this.correoService.enviarCorreo(request).subscribe({
      next: () => {
        this.carga.hide();
        this.snackBar.snackBarExito('Correo enviado exitosamente');
        this.cerrarModal();
      },
      error: (error) => {
        this.carga.hide();
        this.snackBar.snackBarError(error.error || 'Error al enviar correo');
      },
    });
  }

  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.imagenesUrls = [];
    this.imagenesBase64 = [];
  }
}
