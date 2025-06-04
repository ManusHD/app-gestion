import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormularioEntradaSalidaService } from 'src/app/services/formulario-entrada-salida.service';
import { Entrada } from 'src/app/models/entrada.model';
import { Salida } from 'src/app/models/salida.model';
import { AgenciaTransporte } from 'src/app/models/agencia-transporte.model';
import { ProductoEntrada } from 'src/app/models/productoEntrada.model';
import { Colaborador } from 'src/app/models/colaborador.model';
import { PDV } from 'src/app/models/pdv.model';
import { OtraDireccion } from 'src/app/models/otraDireccion.model';
import { Perfumeria } from 'src/app/models/perfumeria.model';
import { Producto } from 'src/app/models/producto.model';
import { Ubicacion } from 'src/app/models/ubicacion.model';
import { debounceTime } from 'rxjs';

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
  activeRowIndex: number | null = null;
  activeCampoUnico: string | null = null;

  @ViewChild('observaciones', { static: false })
  observacionesInput!: ElementRef;

  productosSalidaUbicacion: any[] = [];

  ngOnInit() {
    // this.carga.show();
    this.importarES.resetExcel();
    this.entradaSalidaForm = this.createForm();

    this.entradaSalidaForm.get('perfumeria')?.setValue('');
    this.entradaSalidaForm.get('pdv')?.setValue('');

    if (this.esEntrada()) {
      this.cargarUbicaciones();
    }

    this.cargarColaboradores();
    this.cargarPerfumerias('a');
    this.cargarOtrasDirecciones('A');

    // pestanaPadre es 'nuevaEntrada' cuando se crea una nueva Entrada
    // pestanaPadre es 'previsionEntrada' cuando se importa una Entrada desde Excel
    // pestanaPadre es 'detallePrevisionEntrada' cuando se visualizan los detalles de una Entrada
    // pestanaPadre es 'nuevaSalida' cuando se crea una nueva Salida
    // pestanaPadre es 'previsionSalida' cuando se importa una Salida desde Excel
    // pestanaPadre es 'detallePrevisionSalida' cuando se visualizan los detalles de una Salida
    // En el if entro cuando creo una nueva Entrada/Salida o la importo desde Excel
    if (!this.detallesES) {
      this.salidaUbicacionService.productos$.subscribe((productos) => {
        if (productos.length > 0) {
          this.productosSalidaUbicacion = productos;
          this.actualizarProductos(productos); // función para mapear a tu formulario
        }
      });

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

    this.entradaSalidaForm
      .get('otroOrigenDestino')
      ?.valueChanges.pipe(
        debounceTime(300) // Añadir un delay de 300ms entre la pulsación de tecla y la búsqueda
      )
      .subscribe((value) => {
        if (value == '') {
          this.limpiarCamposDireccion();
          // this.otrasDirecciones = [];
          this.otraDireccionSeleccionada = null;
        } else {
          this.cargarOtrasDirecciones(value);
        }
      });

    this.entradaSalidaForm
      .get('perfumeria')
      ?.valueChanges.pipe(
        debounceTime(300) // Añadir un delay de 300ms entre la pulsación de tecla y la búsqueda
      )
      .subscribe((value) => {
        if (value == '' || value == null) {
          this.limpiarCamposDireccion();
          // this.perfumerias = [];
          this.perfumeriaSeleccionada = null;
        } else {
          this.cargarPerfumerias(value);
        }
      });

    if (this.currentPath.startsWith('/salidas')) {
      this.entradaSalidaForm.get('pdv')?.valueChanges.subscribe((value) => {
        if (value) {
          this.rellenarDireccionPDV(value);
        } else {
          this.limpiarCamposDireccion();
        }
      });

      this.entradaSalidaForm
        .get('colaborador')
        ?.valueChanges.subscribe((value) => {
          if (value) {
            this.rellenarDireccionColaborador(value);
          } else {
            this.limpiarCamposDireccion();
          }
        });
    }
  }

  ngOnDestroy() {
    this.entradaSalidaForm.reset();
    this.salidaUbicacionService.resetProductos();
  }

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
    const perfumeria = this.getCampoValue('perfumeria');
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

  cargarPDVPerfumeria(perfumeria: string) {
    this.direccionesService.getPdvsPerfumeria(perfumeria).subscribe(
      (data: PDV[]) => {
        this.pdvs = data;
        console.log(this.pdvs);
      }
    );
  }

  cargarColaboradores() {
    this.direccionesService.getColaboradoresActivos().subscribe({
      next: (data) => {
        this.colaboradores = data;
      },
      error: (error) => {
        console.error('Error al obtener colaboradores', error);
      },
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
          this.otrasDirecciones = this.otrasDirecciones.filter((d: any) =>
            d.nombre.includes(direccion)
          );
        },
        error: (error) => {
          console.error('Error al obtener otras direcciones', error);
        },
      });
  }

  setProductoPendiente(index: number) {
    const checked = this.productosControls.at(index).get('estado')?.value;
  }

  // Cuando voy a importar un Excel
  private inicializarPrevisionEntradaSalida() {
    this.pendiente = true;
    this.importarES.excelData$.subscribe((excelData) => {
      if (excelData?.length) {
        this.resetForm();
        this.mostrarFormulario = true;
        this.actualizarCamposUnicos(excelData[0]);
        this.actualizarProductos(excelData);
        this.carga.hide();
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
      if (entradaSalidaFormulario.perfumeria != '') {
        this.cargarPDVs().then(() => {
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
      this.cargarPDVs().then(() => {
        this.setCampoValue('pdv', entradaSalidaFormulario.pdv);
      });
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
        ref: row.referencia || row.ref,
        description: row.descripcion || row.description,
        unidades: row.unidades || row.unidadesPedidas,
        unidadesPedidas: row.unidadesPedidas || row.unidades,
        ubicacion: row.ubicacion,
        palets: row.palets || 0,
        bultos: row.bultos || 0,
        formaEnvio: row.formaEnvio,
        observaciones: row.observaciones,
        comprobado: row.comprobado || false,
      });
      if (row.ref) {
        this.buscarDescripcionProducto(productoFormGroup, row.ref);
      }
      this.productosControls.push(productoFormGroup);
    });
  }

  // Cuando voy a ver los Detalles de las Entradas/Salidas Pendientes
  private inicializarDetalleEntradaSalida() {
    this.mostrarFormulario = true;
    this.enDetalles = true;
    this.actualizarProductos(this.detallesES!.productos!);
    this.actualizarCamposUnicos(this.detallesES);
    this.marcarCamposInvalidos();

    setTimeout(() => {
      this.productosControls.controls.sort((a, b) => {
        const refA = a.get('ref')?.value || '';
        const refB = b.get('ref')?.value || '';
        return refA.localeCompare(refB);
      });
      if (this.esSalida()) {
        this.cargarAgenciasTransporte();
        this.productosControls.controls.forEach((control, index) => {
          const ref = control.get('ref')?.value;
          const descripcion = control.get('description')?.value;
          if (ref) {
            this.obtenerUbicacionesProductoSalida(ref);
          }
          if (descripcion) {
            this.obtenerUbicacionesProductoEspecial(ref, descripcion);
          }
        });
      }
    });
  }

  modificarEntrada() {
    this.carga.show();
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
            comprobado: producto.comprobado,
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
    } else {
      this.carga.hide();
    }
  }

  modificarSalida() {
    this.carga.show();
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
            comprobado: producto.comprobado,
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
        fechaEnvio: this.entradaSalidaForm.get('fechaRecepcionEnvio')!.value,
        rellena: false,
      };

      salidaActualizada.rellena = this.todosLosCamposRellenos(salidaActualizada);
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

  todosLosCamposRellenos(salida: Salida): boolean {
    return salida.productos!.every(
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
    const pdvSeleccionado = this.pdvs.find((pdv) => pdv.nombre === nombrePDV);
    if (pdvSeleccionado) {
      this.entradaSalidaForm.patchValue({
        direccion: pdvSeleccionado.direccion || '',
        poblacion: pdvSeleccionado.poblacion || '',
        provincia: pdvSeleccionado.provincia || '',
        cp: pdvSeleccionado.cp || '',
        telefono: pdvSeleccionado.telefono || '',
      });
    }
  }

  // Método para rellenar la dirección desde un Colaborador
  private rellenarDireccionColaborador(nombreColaborador: string) {
    const colaboradorSeleccionado = this.colaboradores.find(
      (col) => col.nombre === nombreColaborador
    );
    if (colaboradorSeleccionado) {
      this.entradaSalidaForm.patchValue({
        direccion: colaboradorSeleccionado.direccion || '',
        poblacion: colaboradorSeleccionado.poblacion || '',
        provincia: colaboradorSeleccionado.provincia || '',
        cp: colaboradorSeleccionado.cp || '',
        telefono: colaboradorSeleccionado.telefono || '',
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
        telefono: '',
      });
    }
  }

  // onPerfumeriaChange(nombrePerfumeria: string) {
  //   if (nombrePerfumeria) {
  //     this.cargarPDVs(nombrePerfumeria);
  //     // Limpiamos el PDV seleccionado y por tanto su dirección asociada
  //     this.entradaSalidaForm.patchValue({
  //       pdv: '',
  //     });
  //   } else {
  //     this.pdvs = [];
  //     if (this.currentPath.startsWith('/salidas')) {
  //       this.limpiarCamposDireccion();
  //     }
  //   }
  // }

  // Método para seleccionar una dirección
  selectOtraDireccion(direccion: OtraDireccion) {
    this.entradaSalidaForm.patchValue({
      otroOrigenDestino: direccion.nombre,
      // Limpiamos los otros campos que podrían tener dirección
      pdv: '',
      colaborador: '',
    });

    if (this.currentPath.startsWith('/salidas')) {
      this.entradaSalidaForm.patchValue({
        direccion: direccion.direccion || '',
        poblacion: direccion.poblacion || '',
        provincia: direccion.provincia || '',
        cp: direccion.cp || '',
        telefono: direccion.telefono || '',
      });
    }

    this.otraDireccionSeleccionada = direccion;
  }

  // Método para seleccionar una dirección
  selectPerfumeria(perfumeria: Perfumeria) {
    this.entradaSalidaForm.patchValue({
      perfumeria: perfumeria.nombre,
      // Limpiamos los otros campos que podrían tener dirección
      otroOrigenDestino: '',
      colaborador: '',
    });

    this.perfumeriaSeleccionada = perfumeria;

    this.cargarPDVPerfumeria(perfumeria.nombre!);
  }

  selectVisual(i: number, visual: Producto) {
    this.productosControls
      .at(i)
      .get('description')
      ?.setValue(visual.description);
    this.productosControls.at(i).get('unidades')?.setValue(visual.stock);
    this.obtenerUbicacionesProductoEspecial(
      visual.referencia as string,
      visual.description as string
    );
    console.log('Visual seleccionado: ', visual);
    this.visuales = [];
  }

  selectProductosSR(i: number, sinReferencia: Producto) {
    this.productosControls
      .at(i)
      .get('description')
      ?.setValue(sinReferencia.description);
    this.obtenerUbicacionesProductoEspecial(
      sinReferencia.referencia as string,
      sinReferencia.description as string
    );
    console.log('Producto SR seleccionado: ', sinReferencia);
    this.productosSR = [];
  }

  obtenerUbicacionesProductoEspecial(ref: string, descripcion: string): void {
    if (this.esProductoEspecial(ref)) {
      // Producto especial: se obtienen las ubicaciones por descripción
      if (!descripcion) {
        console.error(
          'No se proporcionó descripción para el producto especial'
        );
        return;
      }
      if (this.ubicacionesPorProducto[descripcion]) {
        console.log('Ya existe producto especial');
        return;
      }
      this.ubicacionesService
        .getUbicacionesByDescripcionProducto(descripcion)
        .subscribe({
          next: (data: Ubicacion[]) => {
            console.log('Producto especial obtenido!!');
            this.ubicacionesPorProducto[descripcion] = data; // Se almacena usando la descripción como clave
          },
          error: (error) => {
            console.error(
              'Error al obtener ubicaciones por descripción:',
              error
            );
            this.ubicacionesPorProducto[descripcion] = [];
          },
        });
    }
  }

  setActiveRow(index: number): void {
    this.activeRowIndex = index;
  }

  clearActiveRow(): void {
    setTimeout(() => {
      this.activeRowIndex = null;
    }, 200);
  }
  
  setActiveCampoUnico(campo: string): void {
    this.activeCampoUnico = campo;
  }
  
  clearActiveCampoUnico(): void {
    setTimeout(() => {
      this.activeCampoUnico = null;
    }, 200);
  }

}
