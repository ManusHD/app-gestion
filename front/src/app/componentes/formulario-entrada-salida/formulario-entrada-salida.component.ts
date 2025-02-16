import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  Output,
  ViewChild,
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
import { DireccionesService } from 'src/app/services/direcciones.service';
import { Colaborador } from 'src/app/models/colaborador.model';
import { PDV } from 'src/app/models/pdv.model';
import { OtraDireccion } from 'src/app/models/otraDireccion.model';
import { Perfumeria } from 'src/app/models/perfumeria.model';
import { Producto } from 'src/app/models/producto.model';

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
  filteredOtrasDirecciones: OtraDireccion[] = [];

  @ViewChild('observaciones', { static: false }) observacionesInput!: ElementRef;

  constructor(
    fb: FormBuilder,
    productoService: ProductoServices,
    entradaService: EntradaServices,
    salidaService: SalidaServices,
    ubicacionesService: UbicacionService,
    agendaTransporteService: AgenciasTransporteService,
    cdr: ChangeDetectorRef,
    private direccionesService: DireccionesService,
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

    this.cargarColaboradores();
    this.cargarOtrasDirecciones();
    this.cargarPerfumerias();
    if(this.esEntrada()) {
      this.cargarUbicaciones();
    }

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

    this.entradaSalidaForm.get('otroOrigenDestino')?.valueChanges.subscribe(value => {
      this.filterOtrasDirecciones(value);
      if (!value) {
        this.limpiarCamposDireccion();
      }
    });
    
    if (this.currentPath.startsWith('/salidas')) {

      this.entradaSalidaForm.get('pdv')?.valueChanges.subscribe(value => {
        console.log("Value en PDV: ", value);
        if (value) {
          this.rellenarDireccionPDV(value);
        } else {
          this.limpiarCamposDireccion();
        }
      });

      this.entradaSalidaForm.get('colaborador')?.valueChanges.subscribe(value => {
        if (value) {
          this.rellenarDireccionColaborador(value);
        } else {
          this.limpiarCamposDireccion();
        }
      });
    }
  }

  cargarPerfumerias() {
    this.direccionesService.getPerfumeriasActivas().subscribe({
      next: (perfumeria: Perfumeria[]) => {
        this.perfumerias = perfumeria;
      },
      error: (error) => {
        console.error('Error al obtener las Perfumerías', error);
      },
    });
  }

  cargarPDVs(nombrePerfumeria: string): Promise<void> {
    const perfumeria = this.getCampoValue('perfumeria');
    if(perfumeria && perfumeria != '') {
      return new Promise((resolve, reject) => {
        this.direccionesService.getPdvsPerfumeria(nombrePerfumeria).subscribe(
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

  cargarColaboradores() {
    this.direccionesService.getColaboradores().subscribe({
      next: (colaboradores: Colaborador[]) => {
        this.colaboradores = colaboradores;
      },
      error: (error) => {
        console.error('Error al obtener colaboradores', error);
      },
    });
  }

  cargarOtrasDirecciones() {
    this.direccionesService.getOtrasDirecciones().subscribe({
      next: (otrasDirecciones: OtraDireccion[]) => {
        this.otrasDirecciones = otrasDirecciones;
      },
      error: (error) => {
        console.error('Error al obtener otras direcciones', error);
      },
    });
  }

  setProductoPendiente(index: number) {
    const checked = this.productosControls.at(index).get('estado')?.value;
    console.log(checked);
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
      this.setCampoValue(
        'perfumeria',
        entradaSalidaFormulario.perfumeria || ''
      );
      if(entradaSalidaFormulario.perfumeria  != '') {
        this.cargarPDVs(entradaSalidaFormulario.perfumeria).then(() => {
          this.setCampoValue('pdv', entradaSalidaFormulario.pdv);
        });
      }
        this.setCampoValue(
        'colaborador',
        entradaSalidaFormulario.colaborador || ''
      );
      this.setCampoValue('otroOrigenDestino', entradaSalidaFormulario.origen);
      this.setCampoValue('dcs', entradaSalidaFormulario.dcs);
    } else if (
      entradaSalidaFormulario &&
      'destino' in entradaSalidaFormulario
    ) {
      this.setCampoValue(
        'fechaRecepcionEnvio',
        this.formatearFecha(entradaSalidaFormulario.fechaEnvio)
      );
      this.setCampoValue(
        'perfumeria',
        entradaSalidaFormulario.perfumeria || ''
      );
      this.cargarPDVs(entradaSalidaFormulario.perfumeria).then(() => {
        this.setCampoValue('pdv', entradaSalidaFormulario.pdv);
      });
      console.log(entradaSalidaFormulario.pdv);
      this.setCampoValue('pdv', entradaSalidaFormulario.pdv);
      this.setCampoValue(
        'colaborador',
        entradaSalidaFormulario.colaborador || ''
      );
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
    this.productosControls.controls.forEach((control, index) => {
        const ref = control.get('ref')?.value;
        if (ref) {
            this.obtenerUbicacionesProductoSalida(ref);
        }
    })
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
            productoId: producto.productoId,
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

      // Crear el objeto Salida
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

      console.log(salidaActualizada);

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

  private rellenarDireccionPDV(nombrePDV: string) {
    const pdvSeleccionado = this.pdvs.find(pdv => pdv.nombre === nombrePDV);
    if (pdvSeleccionado) {
      this.entradaSalidaForm.patchValue({
        direccion: pdvSeleccionado.direccion || '',
        poblacion: pdvSeleccionado.poblacion || '',
        provincia: pdvSeleccionado.provincia || '',
        cp: pdvSeleccionado.cp || '',
        telefono: pdvSeleccionado.telefono || ''
      });
    }
  }

  // Método para rellenar la dirección desde un Colaborador
  private rellenarDireccionColaborador(nombreColaborador: string) {
    const colaboradorSeleccionado = this.colaboradores.find(col => col.nombre === nombreColaborador);
    if (colaboradorSeleccionado) {
      this.entradaSalidaForm.patchValue({
        direccion: colaboradorSeleccionado.direccion || '',
        poblacion: colaboradorSeleccionado.poblacion || '',
        provincia: colaboradorSeleccionado.provincia || '',
        cp: colaboradorSeleccionado.cp || '',
        telefono: colaboradorSeleccionado.telefono || ''
      });
    }
  }

  // Método para limpiar los campos de dirección
  private limpiarCamposDireccion() {
    // Solo limpiamos si no hay ningún otro campo seleccionado que deba mantener la dirección
    const otroOrigen = this.entradaSalidaForm.get('otroOrigenDestino')?.value;
    const pdv = this.entradaSalidaForm.get('pdv')?.value;
    const colaborador = this.entradaSalidaForm.get('colaborador')?.value;

    if (!otroOrigen && !pdv && !colaborador) {
      this.entradaSalidaForm.patchValue({
        direccion: '',
        poblacion: '',
        provincia: '',
        cp: '',
        telefono: ''
      });
    }
  }

  onPerfumeriaChange(nombrePerfumeria: string) {
    if (nombrePerfumeria) {
      this.cargarPDVs(nombrePerfumeria);
      // Limpiamos el PDV seleccionado y por tanto su dirección asociada
      this.entradaSalidaForm.patchValue({
        pdv: ''
      });
    } else {
      this.pdvs = [];
      if (this.currentPath.startsWith('/salidas')) {
        this.limpiarCamposDireccion();
      }
    }
  }

  // Método para filtrar las direcciones
  filterOtrasDirecciones(value: string) {
    if (!value) {
      this.filteredOtrasDirecciones = [];
      return;
    }

    const filterValue = value.toLowerCase();
    this.filteredOtrasDirecciones = this.otrasDirecciones.filter(direccion =>
      direccion.nombre!.toLowerCase().includes(filterValue)
    );
  }

  // Método actualizado para seleccionar una dirección
  selectOtraDireccion(direccion: OtraDireccion) {
    this.entradaSalidaForm.patchValue({
      otroOrigenDestino: direccion.nombre,
      // Limpiamos los otros campos que podrían tener dirección
      pdv: '',
      colaborador: ''
    });

    if (this.currentPath.startsWith('/salidas')) {
      this.entradaSalidaForm.patchValue({
        direccion: direccion.direccion || '',
        poblacion: direccion.poblacion || '',
        provincia: direccion.provincia || '',
        cp: direccion.cp || '',
        telefono: direccion.telefono || ''
      });
    }

    this.filteredOtrasDirecciones = [];
  }
  
  selectVisual(i: number, visual: Producto) {
    this.productosControls.at(i).get('description')?.setValue(visual.description);
    this.productosControls.at(i).get('productoId')?.setValue(visual.productoId);
    this.productosControls.at(i).get('unidades')?.setValue(visual.stock);
    console.log("Visual seleccionado: ", visual);
    this.visuales = [];
  }
  
  selectProductosSR(i: number, sinReferencia: Producto) {
    this.productosControls.at(i).get('description')?.setValue(sinReferencia.description);
    this.productosControls.at(i).get('productoId')?.setValue(sinReferencia.productoId);
    console.log("Visual seleccionado: ", sinReferencia);
    this.productosSR = [];
  }
}
