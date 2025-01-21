import { Component, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { EntradaServices } from 'src/app/services/entrada.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { FormularioEntradaSalidaService } from 'src/app/services/formulario-entrada-salida.service';
import { ImportarExcelService } from 'src/app/services/importar-excel.service';
import { Entrada } from 'src/app/models/entrada.model';
import { Salida } from 'src/app/models/salida.model';
import { UbicacionService } from 'src/app/services/ubicacion.service';
import { SalidaServices } from 'src/app/services/salida.service';
import { AgenciasTransporteService } from 'src/app/services/agencias-transporte.service';
import { ProductoSalida } from 'src/app/models/productoSalida.model';
import { AgenciaTransporte } from 'src/app/models/agencia-transporte.model';

@Component({
  selector: 'app-formulario-entrada-salida',
  templateUrl: './formulario-entrada-salida.component.html',
  styleUrls: ['./formulario-entrada-salida.component.css'],
})
export class FormularioEntradaSalidaComponent
  extends FormularioEntradaSalidaService
  implements OnInit
{
  @Input() pestanaPadre: String = ''; // Indica al componente donde se está abriendo y en función a ello mostrará unos botones u otros
  @Input() detallesES?: Entrada | Salida = undefined;
  enDetalles: boolean = false;

  agenciasTransporte: AgenciaTransporte[] = [];
  
  constructor(
    fb: FormBuilder,
    productoService: ProductoServices,
    entradaService: EntradaServices,
    salidaService: SalidaServices,
    ubicacionesService: UbicacionService,
    agendaTransporteService: AgenciasTransporteService,
    private importarES: ImportarExcelService
  ) {
    super(fb, productoService, entradaService, salidaService, ubicacionesService, agendaTransporteService);
  }

  ngOnInit() {
    this.entradaSalidaForm = this.initForm();

    // pestanaPadre es 'nuevaEntrada' cuando se crea una nueva Entrada
    // pestanaPadre es 'previsionEntrada' cuando se importa una Entrada desde Excel
    // pestanaPadre es 'detallePrevisionEntrada' cuando se visualizan los detalles de una Entrada
    // pestanaPadre es 'nuevaSalida' cuando se crea una nueva Salida
    // pestanaPadre es 'previsionSalida' cuando se importa una Salida desde Excel
    // pestanaPadre es 'detallePrevisionSalida' cuando se visualizan los detalles de una Salida
    // En el if entro cuando creo una nueva Entrada/Salida o la importo desde Excel
    if (!this.detallesES) {
      if(this.pestanaPadre === 'nuevaSalida' || this.pestanaPadre === 'previsionSalida' || this.pestanaPadre === 'detallePrevisionSalida') {
        this.cargarAgenciasTransporte();
      }
      if (this.pestanaPadre !== 'nuevaEntrada' && this.pestanaPadre !== 'nuevaSalida') {
        this.inicializarPrevisionEntradaTrabajo();
      } else {
        this.inicializarNuevaEntradaTrabajo();
      }
    } else {
      this.inicializarDetalleEntradaTrabajo();
    }
    
    console.log(this.currentPath);    

    this.cargarUbicaciones();
  }
  
  setProductoPendiente(index: number) {
    const checked = this.productosControls.at(index).get('estado')?.value
    console.log(checked);
  }

  // Cuando estoy en Grabar Entrada
  private inicializarNuevaEntradaTrabajo() {
    this.mostrarFormulario = true;
    this.pendiente = false;
  }

  // Cuando voy a importar un Excel
  private inicializarPrevisionEntradaTrabajo() {
    this.pendiente = true;
    this.importarES.excelData$.subscribe((excelData) => {
      if (excelData?.length) {
        this.mostrarFormulario = true;
        this.actualizarProductos(excelData);
      } else {
        this.mostrarFormulario = false;
      }
    });
  }

  private actualizarProductos(productos: any[], origenDestino?: string) {
    this.productosControls.clear();
    productos.forEach((row) => {
      const productoFormGroup = this.crearProductoFormGroup();
      productoFormGroup.patchValue({
        numeroEntradaSalida: origenDestino || row.origen || row.destino,
        dcs: row.dcs,
        ref: row.ref,
        description: row.descripcion || row.description,
        unidades: row.unidades,
        fechaRecepcionEnvio: this.formatearFecha(
          row.fechaRecepcion || row.fechaEnvio
        ),
        ubicacion: row.ubicacion,
        palets: row.palets,
        bultos: row.bultos,
        formaEnvio: row.formaEnvio,
        observaciones: row.observaciones,
        pendiente: row.pendiente || false,
        idPadre: row.idPadre
      });
      if (row.ref) {
        this.buscarDescripcionProducto(productoFormGroup, row.ref);
      }
      this.productosControls.push(productoFormGroup);
    });
  }

  // Cuando voy a ver los Detalles de las Entradas Pendientes
  private inicializarDetalleEntradaTrabajo() {
    this.cargarAgenciasTransporte();
    this.mostrarFormulario = true;
    this.enDetalles = true;
    const origenDestino = this.obtenerOrigenDestino(this.detallesES!);
    this.actualizarProductos(this.detallesES!.productos!, origenDestino);
  }

  private obtenerOrigenDestino(detalles: Entrada | Salida): string {
    if ('origen' in detalles) return detalles.origen!;
    if ('destino' in detalles) return detalles.destino!;
    return '';
  }

  modificarEntrada() {
    const entradaData: Entrada = {
      ...this.detallesES,
      productos: this.entradaSalidaForm.value.productos.map((producto: any) => ({
        ...producto,
        fechaRecepcion: producto.fechaRecepcionEnvio ? new Date(producto.fechaRecepcionEnvio) : undefined,
      })),
      estado: this.detallesES?.estado ?? false,
    };

    this.entradaService
      .updateEntrada(entradaData)
      .subscribe({
        next: (updatedEntrada) => {
          console.log('Entrada actualizada:', updatedEntrada);
          location.reload();
          this.snackBarExito('Entrada actualizada exitosamente');
        },
        error: (err) => console.error('Error al actualizar la entrada:', err),
      });
  }

  modificarSalida() {
    const salidaData: Salida = {
      ...this.detallesES,
      productos: this.entradaSalidaForm.value.productos.map((producto: any) => ({
        ...producto,
        fechaEnvio: producto.fechaRecepcionEnvio ? new Date(producto.fechaRecepcionEnvio) : undefined,
      })),
      estado: this.detallesES?.estado ?? false,
    };

    this.salidaService
      .updateSalida(salidaData)
      .subscribe({
        next: (updatedSalida) => {
          console.log('Salida actualizada:', updatedSalida);
          location.reload();
          this.snackBarExito('Salida actualizada exitosamente');
        },
        error: (err) => console.error('Error al actualizar la salida:', err),
      });
  }

  cargarAgenciasTransporte() {
    this.agenciasTransporteService.getAgenciasTransporteActivas().subscribe({
      next: (agencias) => {
        this.agenciasTransporte = agencias;
      },
      error: (error) => {
        console.error('Error al obtener agencias de transporte', error);
      },
    });
  }
}
