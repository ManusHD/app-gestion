import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  Output,
} from '@angular/core';
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
import { ProductoEntrada } from 'src/app/models/productoEntrada.model';

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
    cdr: ChangeDetectorRef,
    private importarES: ImportarExcelService
  ) {
    super(
      fb,
      productoService,
      entradaService,
      salidaService,
      ubicacionesService,
      agendaTransporteService,
      cdr
    );
  }

  ngOnInit() {
    this.importarES.resetExcel();
    this.entradaSalidaForm = this.createForm();

    this.entradaSalidaForm.get('perfumeria')?.setValue('');
    this.entradaSalidaForm.get('pdv')?.setValue('');

    // pestanaPadre es 'nuevaEntrada' cuando se crea una nueva Entrada
    // pestanaPadre es 'previsionEntrada' cuando se importa una Entrada desde Excel
    // pestanaPadre es 'detallePrevisionEntrada' cuando se visualizan los detalles de una Entrada
    // pestanaPadre es 'nuevaSalida' cuando se crea una nueva Salida
    // pestanaPadre es 'previsionSalida' cuando se importa una Salida desde Excel
    // pestanaPadre es 'detallePrevisionSalida' cuando se visualizan los detalles de una Salida
    // En el if entro cuando creo una nueva Entrada/Salida o la importo desde Excel
    if (!this.detallesES) {
      this.cargarAgenciasTransporte();
      if (
        this.pestanaPadre !== 'nuevaEntrada' &&
        this.pestanaPadre !== 'nuevaSalida'
      ) {
        this.inicializarPrevisionEntradaSalida();
      } else {
        this.inicializarNuevaEntradaSalida();
      }
    } else {
      this.inicializarDetalleEntradaSalida();
    }
    this.cargarUbicaciones();
  }

  setProductoPendiente(index: number) {
    const checked = this.productosControls.at(index).get('estado')?.value;
    console.log(checked);
  }

  // Cuando estoy en Grabar Entrada
  private inicializarNuevaEntradaSalida() {
    this.mostrarFormulario = true;
    this.pendiente = false;
    this.setCampoValue('fechaRecepcionEnvio', this.formatearFecha(new Date()));
  }

  // Cuando voy a importar un Excel
  private inicializarPrevisionEntradaSalida() {
    this.pendiente = true;
    this.importarES.excelData$.subscribe((excelData) => {
      if (excelData?.length) {
        this.mostrarFormulario = true;
        this.actualizarCamposUnicos(excelData[0]);
        this.actualizarProductos(excelData);
      } else {
        this.mostrarFormulario = false;
      }
      this.mostrarFormulario = true;
    });
  }

  private actualizarCamposUnicos(entradaSalidaFormulario: any) {
    if (entradaSalidaFormulario && 'origen' in entradaSalidaFormulario) {
      this.setCampoValue(
        'fechaRecepcionEnvio',
        this.formatearFecha(entradaSalidaFormulario.fechaRecepcion)
      );
      this.setCampoValue('perfumeria', entradaSalidaFormulario.perfumeria || '');
      this.setCampoValue('pdv', entradaSalidaFormulario.pdv || '');
      this.setCampoValue('colaborador', entradaSalidaFormulario.colaborador || '');
      this.setCampoValue('otroOrigenDestino', entradaSalidaFormulario.origen);
      this.setCampoValue('dcs', entradaSalidaFormulario.dcs);
    } else if (
      entradaSalidaFormulario &&
      'destino' in entradaSalidaFormulario
    ) {
      this.setCampoValue('fechaRecepcionEnvio', this.formatearFecha(entradaSalidaFormulario.fechaEnvio));
      this.setCampoValue('perfumeria', entradaSalidaFormulario.perfumeria || '');
      this.setCampoValue('pdv', entradaSalidaFormulario.pdv || '');
      this.setCampoValue('colaborador', entradaSalidaFormulario.colaborador || '');
      this.setCampoValue('otroOrigenDestino', entradaSalidaFormulario.destino);
      this.setCampoValue('direccion', entradaSalidaFormulario.direccion);
      this.setCampoValue('poblacion', entradaSalidaFormulario.poblacion);
      this.setCampoValue('provincia', entradaSalidaFormulario.provincia);
      this.setCampoValue('cp', entradaSalidaFormulario.cp);
      this.setCampoValue('telefono', entradaSalidaFormulario.telefono);
    }
  }

  private actualizarProductos(productos: any[]) {
    productos.forEach((row) => {
      const productoFormGroup = this.createProductoGroup();
      productoFormGroup.patchValue({
        ref: row.ref,
        description: row.descripcion || row.description,
        unidades: row.unidades,
        unidadesPedidas: row.unidadesPedidas || row.unidades,
        ubicacion: row.ubicacion,
        palets: row.palets,
        bultos: row.bultos,
        formaEnvio: row.formaEnvio,
        observaciones: row.observaciones,
        pendiente: row.pendiente || false,
      });
      if (row.ref) {
        this.buscarDescripcionProducto(productoFormGroup, row.ref);
      }
      this.productosControls.push(productoFormGroup);
    });
  }

  // Cuando voy a ver los Detalles de las Entradas Pendientes
  private inicializarDetalleEntradaSalida() {
    this.cargarAgenciasTransporte();
    this.mostrarFormulario = true;
    this.enDetalles = true;
    this.actualizarProductos(this.detallesES!.productos!);
    this.actualizarCamposUnicos(this.detallesES);
    this.marcarCamposInvalidos();
  }

  modificarEntrada() {
    if (this.previsionEsValida()) {
      const productosEntrada: ProductoEntrada[] =
        this.entradaSalidaForm.value.productos.map((producto: any) => {
          // Crear un nuevo objeto ProductoEntrada
          return {
            ref: producto.ref,
            description: producto.description,
            unidades: producto.unidades,
            ubicacion: producto.ubicacion,
            palets: producto.palets,
            bultos: producto.bultos,
            observaciones: producto.observaciones,
            pendiente: producto.pendiente,
          };
        });

      console.log('Productos entrada:', productosEntrada);

      // Crear el objeto Entrada
      const entradaActualizada: Entrada = {
        id: this.detallesES?.id,
        origen: this.entradaSalidaForm.get('otroOrigenDestino')?.value,
        colaborador: this.entradaSalidaForm.get('colaborador')?.value,
        perfumeria: this.entradaSalidaForm.get('perfumeria')?.value,
        pdv: this.entradaSalidaForm.get('pdv')?.value,
        dcs: this.entradaSalidaForm.get('dcs')!.value,
        estado: !this.pendiente,
        productos: productosEntrada,
        rellena: false,
        fechaRecepcion: this.entradaSalidaForm.get('fechaRecepcionEnvio')!
          .value,
      };

      this.entradaService.updateEntrada(entradaActualizada).subscribe({
        next: (updatedEntrada) => {
          console.log('Entrada actualizada:', updatedEntrada);
          location.reload();
          this.snackBarExito('Entrada actualizada exitosamente');
        },
        error: (err) => console.error('Error al actualizar la entrada:', err),
      });
    }
  }

  modificarSalida() {
    if (this.previsionEsValida()) {
      const productosSalida: ProductoEntrada[] =
        this.entradaSalidaForm.value.productos.map((producto: any) => {
          // Crear un nuevo objeto ProductoEntrada
          return {
            ref: producto.ref,
            description: producto.description,
            unidades: producto.unidades,
            unidadesPedidas: producto.unidadesPedidas,
            ubicacion: producto.ubicacion,
            palets: producto.palets,
            bultos: producto.bultos,
            observaciones: producto.observaciones,
            formaEnvio: producto.formaEnvio,
            pendiente: producto.pendiente,
          };
        });

      console.log('Productos entrada:', productosSalida);

      // Crear el objeto Entrada
      const salidaActualizada: Salida = {
        id: this.detallesES?.id,
        destino: this.entradaSalidaForm.get('otroOrigenDestino')?.value,
        colaborador: this.entradaSalidaForm.get('colaborador')?.value,
        perfumeria: this.entradaSalidaForm.get('perfumeria')?.value,
        pdv: this.entradaSalidaForm.get('pdv')?.value,
        direccion: this.entradaSalidaForm.get('direccion')!.value,
        poblacion: this.entradaSalidaForm.get('poblacion')!.value,
        provincia: this.entradaSalidaForm.get('provincia')!.value,
        cp: this.entradaSalidaForm.get('cp')!.value,
        telefono: this.entradaSalidaForm.get('telefono')!.value,
        estado: !this.pendiente,
        productos: productosSalida,
        rellena: false,
        fechaEnvio: this.entradaSalidaForm.get('fechaRecepcionEnvio')!.value,
      };

      this.salidaService.updateSalida(salidaActualizada).subscribe({
        next: (updatedSalida) => {
          console.log('Salida actualizada:', updatedSalida);
          location.reload();
          this.snackBarExito('Salida actualizada exitosamente');
        },
        error: (err) => console.error('Error al actualizar la salida:', err),
      });
    }
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

  esPrevision(): boolean {
    return this.pestanaPadre.startsWith('prevision');
  }
}
