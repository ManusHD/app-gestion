import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Salida } from 'src/app/models/salida.model';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SalidaServices } from 'src/app/services/salida.service';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { SnackBar } from 'src/app/services/snackBar.service';
import { ModalEnviarCorreoComponent } from '../modal-enviar-correo/modal-enviar-correo.component';

@Component({
  selector: 'app-detalles-salidas',
  templateUrl: './detalles-salidas.component.html',
  styleUrls: [
    '../../../assets/styles/modal.css',
    './detalles-salidas.component.css',
  ]
})
export class DetallesSalidasComponent implements OnInit {
  mostrarModal: boolean = false;
  @Input() enRecibidas: boolean = false;
  @Input() salida!: Salida;
  @Output() salidaRellena = new EventEmitter<boolean>();
  @Output() salidaMovidaAEnvios = new EventEmitter<void>(); // ⬅️ NUEVO
  currentPath: string = window.location.pathname;

  mostrarEtiqueta: boolean = false;

  constructor(
    private carga: PantallaCargaService,
    private dialog: MatDialog,
    private direccionesService: DireccionesService,
    private snackBar: SnackBar
  ) {}

  ngOnInit() {
    if (!this.enRecibidas) {
      this.iniciarSalidas();
    }
  }

  iniciarSalidas() {
    this.salida.fechaEnvio = this.salida.fechaEnvio || this.formatearFecha(new Date()) || undefined;
    this.salidaRellena.emit(this.todosLosCamposRellenos());
  }

  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  actualizarFecha(fecha: string) {
    this.salida.fechaEnvio = fecha;
  }

  todosLosCamposRellenos(): boolean {
    return this.salida.productos!.every(
      (producto) =>
        producto.description &&
        producto.unidades &&
        producto.unidades > 0 &&
        producto.ubicacion &&
        producto.ubicacion != '' &&
        producto.palets! >= 0 &&
        producto.bultos! >= 0 &&
        producto.formaEnvio &&
        producto.formaEnvio.trim() !== '' &&
        producto.comprobado
    );
  }

  formatearFecha(fecha: any): string | null {
    if (!fecha) return null;

    if (fecha instanceof Date || typeof fecha === 'string') {
      return new Date(fecha).toISOString().split('T')[0];
    }

    if (typeof fecha === 'number') {
      const excelDate = new Date(Date.UTC(1900, 0, fecha - 1));
      return excelDate.toISOString().split('T')[0];
    }

    return null;
  }

  mostrarEtiquetaEnvio() {
    this.mostrarEtiqueta = true;
  }

  cerrarEtiqueta() {
    this.mostrarEtiqueta = false;
  }

  // ⬇️⬇️⬇️ NUEVO MÉTODO ⬇️⬇️⬇️
  abrirModalCorreo(): void {
    console.log('📧 Abriendo modal de correo para salida:', this.salida.id);

    if (!this.salida.colaborador) {
      this.snackBar.snackBarError('Esta salida no tiene colaborador asignado');
      return;
    }

    this.carga.show();
    this.direccionesService.getColaborador(this.salida.colaborador).subscribe({
      next: (colaborador) => {
        this.carga.hide();
        console.log('📧 Colaborador encontrado:', colaborador);

        if (!colaborador.email || colaborador.email.trim() === '') {
          this.snackBar.snackBarError('El colaborador no tiene email registrado');
          
          const moverSinCorreo = confirm(
            '¿Desea mover la salida a envíos pendientes sin enviar correo?'
          );
          
          if (moverSinCorreo) {
            this.moverAEnviosPendientes();
          }
          return;
        }

        // Abrir modal de envío de correo
        const dialogRef = this.dialog.open(ModalEnviarCorreoComponent, {
          width: '800px',
          maxHeight: '90vh',
          disableClose: true,
          data: {
            salida: this.salida,
            emailColaborador: colaborador.email
          }
        });

        dialogRef.afterClosed().subscribe((resultado) => {
          console.log('📧 Modal cerrado, resultado:', resultado);
          
          if (resultado === true) {
            // Correo enviado exitosamente
            this.snackBar.snackBarExito('Correo enviado correctamente');
            this.moverAEnviosPendientes();
          } else if (resultado === false) {
            // Usuario canceló
            const moverSinCorreo = confirm(
              '¿Desea mover la salida a envíos pendientes sin enviar el correo?'
            );
            
            if (moverSinCorreo) {
              this.moverAEnviosPendientes();
            }
          }
        });
      },
      error: (error) => {
        this.carga.hide();
        console.error('❌ Error al obtener colaborador:', error);
        this.snackBar.snackBarError('Error al verificar el email del colaborador');
      }
    });
  }

  private moverAEnviosPendientes(): void {
    console.log('✅ Moviendo salida a envíos pendientes');
    this.salida.rellena = true;
    this.cerrarModal();
    this.salidaMovidaAEnvios.emit();
  }
}