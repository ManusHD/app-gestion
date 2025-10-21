import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CorreoService } from 'src/app/services/correo.service';
import { PlantillaCorreo } from 'src/app/models/plantilla-correo.model';
import { EnviarCorreoRequest } from 'src/app/models/enviar-correo-request.model';
import { Salida } from 'src/app/models/salida.model';
import { SnackBar } from 'src/app/services/snackBar.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';

@Component({
  selector: 'app-modal-enviar-correo',
  templateUrl: './modal-enviar-correo.component.html',
  styleUrls: ['./modal-enviar-correo.component.css']
})
export class ModalEnviarCorreoComponent implements OnInit {
  formCorreo!: FormGroup;
  plantillas: PlantillaCorreo[] = [];
  plantillaSeleccionada: PlantillaCorreo | null = null;
  imagenesUrls: string[] = [];
  mostrarVistaPrevia = false;

  constructor(
    public dialogRef: MatDialogRef<ModalEnviarCorreoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { salida: Salida; emailColaborador: string },
    private fb: FormBuilder,
    private correoService: CorreoService,
    private snackBar: SnackBar,
    private carga: PantallaCargaService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarPlantillas();
  }

  initForm(): void {
    const destinoNombre = this.data.salida.colaborador || this.data.salida.pdv || this.data.salida.destino;
    
    this.formCorreo = this.fb.group({
      plantillaId: [''],
      destinatario: [this.data.emailColaborador, [Validators.required, Validators.email]],
      asunto: [`Notificación de envío - ${destinoNombre}`, Validators.required],
      cuerpo: [this.generarCuerpoDefault(), Validators.required]
    });
  }

  cargarPlantillas(): void {
    this.correoService.getPlantillasActivas().subscribe({
      next: (plantillas) => {
        this.plantillas = plantillas;
      },
      error: (error) => {
        console.error('Error al cargar plantillas:', error);
      }
    });
  }

  onPlantillaChange(): void {
    const plantillaId = this.formCorreo.get('plantillaId')?.value;
    if (!plantillaId) return;

    this.plantillaSeleccionada = this.plantillas.find(p => p.id === plantillaId) || null;
    
    if (this.plantillaSeleccionada) {
      const cuerpoConVariables = this.reemplazarVariables(this.plantillaSeleccionada.cuerpo || '');
      const asuntoConVariables = this.reemplazarVariables(this.plantillaSeleccionada.asunto || '');
      
      this.formCorreo.patchValue({
        asunto: asuntoConVariables,
        cuerpo: cuerpoConVariables
      });
    }
  }

  reemplazarVariables(texto: string): string {
    const salida = this.data.salida;
    
    return texto
      .replace(/{nombreColaborador}/g, salida.colaborador || salida.pdv || salida.destino || '')
      .replace(/{direccion}/g, salida.direccion || '')
      .replace(/{poblacion}/g, salida.poblacion || '')
      .replace(/{provincia}/g, salida.provincia || '')
      .replace(/{cp}/g, salida.cp || '')
      .replace(/{fechaEnvio}/g, salida.fechaEnvio ? new Date(salida.fechaEnvio).toLocaleDateString('es-ES') : '')
      .replace(/{telefono}/g, salida.telefono || '')
      .replace(/{productos}/g, this.generarListaProductos());
  }

  generarCuerpoDefault(): string {
    const salida = this.data.salida;
    const destinoNombre = salida.colaborador || salida.pdv || salida.destino;
    
    return `
      <p>Estimado/a ${destinoNombre},</p>
      <p>Le informamos que su envío ha sido preparado y está listo para su despacho.</p>
      <p><strong>Detalles del envío:</strong></p>
      ${this.generarListaProductos()}
      <p><strong>Dirección de envío:</strong></p>
      <p>${salida.direccion || ''}<br>
      ${salida.cp || ''} - ${salida.poblacion || ''} (${salida.provincia || ''})</p>
      <p>Saludos cordiales,<br>Equipo DELIM</p>
    `;
  }

  generarListaProductos(): string {
    if (!this.data.salida.productos || this.data.salida.productos.length === 0) {
      return '<p>No hay productos en este envío.</p>';
    }

    let html = '<ul>';
    this.data.salida.productos.forEach(producto => {
      html += `<li>${producto.ref} - ${producto.description}: ${producto.unidades} unidades</li>`;
    });
    html += '</ul>';
    
    return html;
  }

  agregarImagenUrl(): void {
    const url = prompt('Ingrese la URL de la imagen:');
    if (url && url.trim() !== '') {
      this.imagenesUrls.push(url.trim());
    }
  }

  eliminarImagen(index: number): void {
    this.imagenesUrls.splice(index, 1);
  }

  toggleVistaPrevia(): void {
    this.mostrarVistaPrevia = !this.mostrarVistaPrevia;
  }

  enviarCorreo(): void {
    if (this.formCorreo.invalid) {
      this.snackBar.snackBarError('Por favor complete todos los campos requeridos');
      return;
    }

    this.carga.show();

    const request: EnviarCorreoRequest = {
      destinatario: this.formCorreo.get('destinatario')?.value,
      asunto: this.formCorreo.get('asunto')?.value,
      cuerpo: this.formCorreo.get('cuerpo')?.value,
      salidaId: this.data.salida.id,
      colaboradorNombre: this.data.salida.colaborador,
      imagenesUrls: this.imagenesUrls
    };

    this.correoService.enviarCorreo(request).subscribe({
      next: () => {
        this.carga.hide();
        this.snackBar.snackBarExito('Correo enviado exitosamente');
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.carga.hide();
        this.snackBar.snackBarError(error.error || 'Error al enviar correo');
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}