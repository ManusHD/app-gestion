import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Estado } from 'src/app/models/estado.model';
import { MigrarEstadoDTO } from 'src/app/models/MigrarEstadoDTO';
import { ProductoUbicacion } from 'src/app/models/productoUbicacion.model';
import { TransferirEstadoDTO } from 'src/app/models/TransferirEstadoDTO.interface';
import { TransferirEstadoUbicacionDTO } from 'src/app/models/TransferirEstadoUbicacionDTO';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { AuthService } from 'src/app/services/auth-service.service';
import { EstadoService } from 'src/app/services/estado.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { SalidaUbicacionService } from 'src/app/services/salida-ubicacion.service';
import { SnackBar } from 'src/app/services/snackBar.service';
import { UbicacionService } from 'src/app/services/ubicacion.service';

interface ProductoUbicacionAgrupado {
  referencia: string;
  description: string;
  productos: ProductoUbicacion[];
  totalUnidades: number;
  expanded: boolean;
}

@Component({
  selector: 'app-detalles-ubicacion',
  templateUrl: './detalles-ubicacion.component.html',
  styleUrls: [
    '../../../assets/styles/modal.css',
    './detalles-ubicacion.component.css',
  ],
})
export class DetallesUbicacionComponent {
  currentPath = window.location.pathname;
  mostrarModal: boolean = false;
  @Input() ubicacion!: Ubicacion;

  // Propiedades para agrupar y transferir estados
  productosAgrupados: ProductoUbicacionAgrupado[] = [];
  estados: Estado[] = [];
  mostrarTransferencia: { [key: string]: boolean } = {};
  transferirData: { [key: string]: TransferirEstadoUbicacionDTO } = {};
  estadoDestinoSinEstado: string | null = null;

  ubicacionSeleccionada: boolean = false;

  constructor(
    private salidaUbicacionService: SalidaUbicacionService,
    private router: Router,
    private ubicacionService: UbicacionService,
    private estadoService: EstadoService,
    private productoService: ProductoServices,
    private snackbar: SnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarEstados();
    this.agruparProductos();
    this.verificarSeleccion();
  }

  // NUEVO: Verificar si la ubicación está seleccionada
  verificarSeleccion(): void {
    this.ubicacionSeleccionada = this.salidaUbicacionService.estaUbicacionSeleccionada(this.ubicacion.id!);
  }

  toggleSeleccionUbicacion(): void {
    if (this.ubicacionSeleccionada) {
      this.salidaUbicacionService.quitarUbicacionDeSeleccion(this.ubicacion.id!);
      this.ubicacionSeleccionada = false;
      this.snackbar.snackBarExito(`Ubicación ${this.ubicacion.nombre} quitada de la selección`);
    } else {
      this.salidaUbicacionService.agregarUbicacionASeleccion(this.ubicacion);
      this.ubicacionSeleccionada = true;
      this.snackbar.snackBarExito(`Ubicación ${this.ubicacion.nombre} agregada a la selección`);
    }
  }

  sacarUbicacion() {
    console.log('Salgo');
    this.salidaUbicacionService.enviarProductos(this.ubicacion.productos!);
    this.router.navigate(['/salidas']);
  }

  // Métodos del modal original
  mostrarDetalles(): void {
    this.mostrarModal = true;
    this.agruparProductos(); // Reagrupar al abrir modal
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    // Limpiar formularios de transferencia al cerrar
    this.mostrarTransferencia = {};
    this.transferirData = {};
  }

  // Métodos para productos especiales
  tieneProductosEspeciales(): boolean {
    return (
      this.ubicacion.productos?.some((p) =>
        this.esProductoEspecial(p.ref || '')
      ) || false
    );
  }

  getProductosEspeciales(): ProductoUbicacion[] {
    return (
      this.ubicacion.productos?.filter((p) =>
        this.esProductoEspecial(p.ref || '')
      ) || []
    );
  }

  esProductoEspecial(ref: string): boolean {
    const refLimpia = ref.replace(/\s+/g, '').toUpperCase();
    return refLimpia === 'VISUAL' || refLimpia === 'SINREFERENCIA';
  }

  // Métodos para estados
  cargarEstados(): void {
    this.estadoService.getEstados().subscribe(
      (data: Estado[]) => {
        this.estados = data;
      },
      (error) => {
        console.error('Error al cargar estados', error);
      }
    );
  }

  agruparProductos(): void {
    if (!this.ubicacion.productos) {
      this.productosAgrupados = [];
      return;
    }

    const grupos = new Map<string, ProductoUbicacionAgrupado>();

    this.ubicacion.productos.forEach((producto) => {
      // Solo agrupar productos normales (no especiales)
      if (producto.ref && !this.esProductoEspecial(producto.ref)) {
        if (!grupos.has(producto.ref)) {
          grupos.set(producto.ref, {
            referencia: producto.ref,
            description: producto.description || '',
            productos: [],
            totalUnidades: 0,
            expanded: false,
          });
        }

        const grupo = grupos.get(producto.ref)!;
        grupo.productos.push(producto);
        grupo.totalUnidades += producto.unidades || 0;
      }
    });

    this.productosAgrupados = Array.from(grupos.values());
  }

  toggleExpand(referencia: string): void {
    const grupo = this.productosAgrupados.find(
      (g) => g.referencia === referencia
    );
    if (grupo) {
      grupo.expanded = !grupo.expanded;
    }
  }

  // Métodos para transferencia de estados
  mostrarFormularioTransferencia(
    referencia: string,
    estadoOrigen: string
  ): void {
    const key = `${referencia}-${estadoOrigen}-${this.ubicacion.nombre}`;
    this.mostrarTransferencia[key] = true;

    if (!this.transferirData[key]) {
      this.transferirData[key] = {
        ubicacionNombre: this.ubicacion.nombre!,
        referencia: referencia,
        estadoOrigen: estadoOrigen,
        estadoDestino: '',
        cantidad: 1,
      };
    }
  }

  cancelarTransferencia(referencia: string, estadoOrigen: string): void {
    const key = `${referencia}-${estadoOrigen}-${this.ubicacion.nombre}`;
    this.mostrarTransferencia[key] = false;
    delete this.transferirData[key];
  }

  ejecutarTransferencia(referencia: string, estadoOrigen: string): void {
    const key = `${referencia}-${estadoOrigen}-${this.ubicacion.nombre}`;
    const dto = this.transferirData[key];

    if (!dto.estadoDestino || dto.cantidad <= 0) {
      this.snackbar.snackBarError('Estado destino y cantidad son requeridos');
      return;
    }

    // Convertir "SIN ESTADO" o valores nulos a cadena vacía antes de enviar
    const dtoParaEnviar: TransferirEstadoUbicacionDTO  = {
      ubicacionNombre: dto.ubicacionNombre,
    referencia: dto.referencia,
    estadoOrigen: dto.estadoOrigen == null ? null : dto.estadoOrigen,
    estadoDestino: dto.estadoDestino == null ? null : dto.estadoDestino,
    cantidad: dto.cantidad
    };

    console.log('Enviando transferencia:', dtoParaEnviar);

    this.ubicacionService.transferirEstadoEnUbicacion(dtoParaEnviar).subscribe(
      (response) => {
        console.log('Transferencia exitosa:', response);
        this.snackbar.snackBarExito('Transferencia realizada correctamente');
        this.cancelarTransferencia(referencia, estadoOrigen);
        this.recargarUbicacion();
      },
      (error) => {
        console.error('Error en transferencia:', error);
        this.snackbar.snackBarError(
          error.error || 'Error al transferir estado'
        );
      }
    );
  }

  private recargarUbicacion(): void {
    this.ubicacionService
      .getUbicacionByNombre(this.ubicacion.nombre!)
      .subscribe(
        (ubicacionActualizada) => {
          this.ubicacion = ubicacionActualizada;
          this.agruparProductos();
        },
        (error) => {
          console.error('Error al recargar ubicación', error);
        }
      );
  }

  // FUNCIÓN HELPER para formatear estados
  formatearEstado(estado: string | null | undefined): string {
    return estado || 'SIN ESTADO';
  }

  asignarEstado(
    referencia: string,
    producto: any,
    estadoSeleccionado: string
  ): void {
    if (producto && estadoSeleccionado) {
      producto.estado = estadoSeleccionado;
      // Opcional: Limpiar el estado seleccionado después de asignar
      producto.estadoSeleccionado = null;

      // Aquí puedes agregar lógica adicional, como emitir un evento o actualizar el backend si es necesario
      const dto: TransferirEstadoDTO = {
        referencia: referencia,
        estadoOrigen: producto.estado || null,
        estadoDestino: estadoSeleccionado,
        cantidad: producto.unidades || 1,
      };

      this.productoService.transferirEstado(dto).subscribe(
        (response) => {
          this.snackbar.snackBarExito(
            `Estado ${estadoSeleccionado} asignado a ${producto.ref}`
          );
          this.recargarUbicacion(); // Recargar ubicación para reflejar cambios
        },
        (error) => {
          this.snackbar.snackBarError(error.error || 'Error al asignar estado');
        }
      );
    }
  }

  migrarProductosSinEstado(referencia: string): void {
    if (!referencia) return;

    if (!this.estadoDestinoSinEstado) return;

    const dto: MigrarEstadoDTO = {
      referencia: referencia,
      estadoDestino: this.estadoDestinoSinEstado,
    };

    this.productoService.migrarProductosSinEstado(dto).subscribe(
      (response) => {
        console.log('Respuesta de migración:', response);
        this.snackbar.snackBarExito('Productos migrados correctamente');
        this.recargarUbicacion();
      },
      (error) => {
        console.error(error);
        console.error('Error en migración:', error);

        this.snackbar.snackBarError(error.error || 'Error al migrar productos');
      }
    );
  }
}
