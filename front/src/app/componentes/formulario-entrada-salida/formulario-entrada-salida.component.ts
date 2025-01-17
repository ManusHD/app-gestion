import { Component, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { EntradaServices } from 'src/app/services/entrada.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { FormularioEntradaSalidaService } from 'src/app/services/formulario-entrada-salida.service';
import { ImportarExcelService } from 'src/app/services/importar-excel.service';
import { Entrada } from 'src/app/models/entrada.model';
import { Salida } from 'src/app/models/salida.model';
import { UbicacionService } from 'src/app/services/ubicacion.service';

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

  constructor(
    fb: FormBuilder,
    productoService: ProductoServices,
    entradaService: EntradaServices,
    entradasFormService: EntradaServices,
    ubicacionesService: UbicacionService,
    private importarES: ImportarExcelService
  ) {
    super(fb, productoService, entradaService, entradasFormService, ubicacionesService);
  }

  ngOnInit() {
    this.entradaForm = this.initForm();

    // En el if entro cuando creo una nueva entrada o la importo desde Excel
    if (!this.detallesES) {
      if (this.pestanaPadre !== 'nuevaEntrada') {
        this.inicializarPrevisionEntrada();
      } else {
        this.inicializarNuevaEntrada();
      }
    } else {
      this.inicializarDetalleEntrada();
    }

    this.getUbicaciones();
  }

  setProductoPendiente(index: number) {
    const checked = this.productosControls.at(index).get('estado')?.value
    console.log(checked);
  }

  // Cuando estoy en Grabar Entrada
  private inicializarNuevaEntrada() {
    this.mostrarFormulario = true;
    this.pendiente = false;
  }

  // Cuando voy a importar un Excel
  private inicializarPrevisionEntrada() {
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
        numeroEntrada: origenDestino || row.origen || row.destino,
        dcs: row.dcs,
        ref: row.ref,
        description: row.descripcion || row.description,
        unidades: row.unidades,
        fechaRecepcion: this.formatearFecha(
          row.fechaRecepcion || row.fechaEnvio
        ),
        ubicacion: row.ubicacion,
        palets: row.palets,
        bultos: row.bultos,
        observaciones: row.observaciones,
        pendiente: row.pendiente,
        idPadre: row.idPadre
      });
      if (row.ref) {
        this.buscarDescripcionProducto(productoFormGroup, row.ref);
      }
      this.productosControls.push(productoFormGroup);
    });
  }

  // Cuando voy a ver los Detalles de las Entradas Pendientes
  private inicializarDetalleEntrada() {
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
    const formValues = this.entradaForm.value;
    this.detallesES = { ...this.detallesES, ...formValues }; // Actualiza el objeto con los valores del formulario
    this.entradaService
      .updateEntrada(this.detallesES!)
      .subscribe({
        next: (updatedEntrada) => {
          console.log('Entrada actualizada:', updatedEntrada);
          location.reload();
          this.snackBarExito('Entrada actualizada exitosamente');
        },
        error: (err) => console.error('Error al actualizar la entrada:', err),
      });
  }
}
