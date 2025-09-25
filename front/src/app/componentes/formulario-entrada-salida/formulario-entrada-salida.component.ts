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

  private isTabbing: boolean = false;

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
    this.cargarTodasOtrasDirecciones();
    this.cargarEstados();

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
        if (value == '' || value == null) {
          this.limpiarCamposDireccion();
          // this.otrasDirecciones = [];
          this.otraDireccionSeleccionada = null;
          this.cargarTodasOtrasDirecciones();
        } else {
          this.cargarOtrasDirecciones(value);
        }
      });

    let nombrePerfumeria = '';
    this.entradaSalidaForm
      .get('perfumeria')
      ?.valueChanges.pipe(
        debounceTime(300) // Añadir un delay de 300ms entre la pulsación de tecla y la búsqueda
      )
      .subscribe((value) => {
        nombrePerfumeria = value;
        if (value == '' || value == null) {
          this.limpiarCamposDireccion();
          // this.perfumerias = [];
          this.entradaSalidaForm.get('pdv')!.setValue('');
          this.pdvs = [];
          this.perfumeriaSeleccionada = null;
          this.pdvSeleccionado = null;
          this.cargarPerfumerias('a');
        } else {
          this.cargarPerfumerias(value);
        }
      });

    this.entradaSalidaForm
      .get('colaborador')
      ?.valueChanges.pipe(
        debounceTime(300) // Añadir un delay de 300ms entre la pulsación de tecla y la búsqueda
      )
      .subscribe((value) => {
        if (value == '' || value == null) {
          this.limpiarCamposDireccion();
          // this.perfumerias = [];
          this.colaboradorSeleccionado = null;
          if (!nombrePerfumeria) {
            this.cargarColaboradores();
          }
        } else {
          this.cargarColaboradoresActivosByNombre(value);
        }
      });


    if(this.hay('pdv') && !this.hay('colaborador')) {
      console.log("NO HAY COLABORADOR Y HAY PDV");
      this.entradaSalidaForm
      .get('pdv')
      ?.valueChanges.pipe(
        debounceTime(300) // Añadir un delay de 300ms entre la pulsación de tecla y la búsqueda
      )
      .subscribe((value) => {
        if (value == '' || value == null) {
          this.limpiarCamposDireccion();
          // this.perfumerias = [];
          this.pdvSeleccionado = null;
          if (nombrePerfumeria) {
            this.cargarPDVs();
          }
        } else {
          this.cargarPDVsPerfumeriaByNombre(nombrePerfumeria, value);
        }
      });
    } else {
      console.log("HAY COLABORADOR");
    }

    if (this.currentPath.startsWith('/salidas')) {
      this.entradaSalidaForm.get('pdv')?.valueChanges.subscribe((value) => {
        if (value) {
          if(this.hay('pdv') && !this.hay('colaborador')) {
            this.rellenarDireccionPDV(value);
          }
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

  hay(campo: string): boolean {
    return this.entradaSalidaForm.get(campo)?.value != '' && this.entradaSalidaForm.get(campo)?.value != null;
  }

  ngOnDestroy() {
    this.entradaSalidaForm.reset();
    this.salidaUbicacionService.resetProductos();
    
    if (this.esSalida()) {
      this.setSalidaActualId(null);
    }
  }

  onEnterKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    // Detectar si se presionó Tab
    if (event.key === 'Tab') {
      this.isTabbing = true;
      // No prevenir el comportamiento por defecto del Tab
      return;
    }

    // Si estamos en un campo con dropdown y hay opciones, seleccionar la primera
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
        this.activeCampoUnico === 'colaborador' &&
        this.colaboradores.length > 0 &&
        !this.colaboradorSeleccionado
      ) {
        event.preventDefault();
        this.selectColaborador(this.colaboradores[0]);
        handled = true;
      } else if (
        this.activeCampoUnico === 'otroOrigenDestino' &&
        this.otrasDirecciones.length > 0 &&
        !this.otraDireccionSeleccionada
      ) {
        event.preventDefault();
        this.selectOtraDireccion(this.otrasDirecciones[0]);
        handled = true;
      }

      if (handled) {
        // Pasar al siguiente campo después de seleccionar
        setTimeout(() => {
          this.focusNextElement(target);
        }, 100);
        return;
      } else {
        // Comportamiento normal del Enter
        event.preventDefault();
        this.focusNextElement(target);
      }
    }

    if (event.ctrlKey && event.key === '+') {
      event.preventDefault();
      this.agregarProducto();
    }
  }

  // Agregar método específico para cuando se hace click en el campo
  onFieldClick(campo: string): void {
    this.activeCampoUnico = campo;
    // Cargar opciones inmediatamente si hay texto
    this.loadOptionsForActiveField();
  }

  // Método para limpiar cuando se pierde el foco por click fuera
  onFieldBlur(event: FocusEvent): void {
    // Verificar si el siguiente elemento enfocado es parte del dropdown
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (
      relatedTarget &&
      relatedTarget.classList.contains('autocomplete-item')
    ) {
      return; // No limpiar si se hizo click en una opción del dropdown
    }

    this.clearActiveCampoUnico();
  }

  // Método auxiliar para enfocar el siguiente elemento
  private focusNextElement(currentElement: HTMLElement): void {
    const inputs = Array.from(
      document.querySelectorAll<HTMLElement>('input, select, textarea, button')
    );
    const index = inputs.indexOf(currentElement);

    if (index >= 0 && index < inputs.length - 1) {
      const nextElement = inputs[index + 1];

      // Si el siguiente elemento es el botón de añadir línea, ejecuta la función
      if (nextElement.classList.contains('add-producto')) {
        this.agregarProducto();
      } else {
        nextElement.focus();
      }
    }
  }

  cargarEstados() {
    this.estadosService.getEstados().subscribe({
      next: (data) => {
        console.log(data);
        this.estados = data;
      },
      error: (error) => {
        console.error('Error al obtener los estados', error);
      },
    });
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
    this.direccionesService
      .getPdvsPerfumeria(perfumeria)
      .subscribe((data: PDV[]) => {
        this.pdvs = data;
        console.log(this.pdvs);
      });
  }

  cargarPDVsPerfumeriaByNombre(nombrePerfumeria: string, nombrePdv: string) {
    this.direccionesService
      .getPDVsDeUnaPerfumeriaByNombres(nombrePerfumeria, nombrePdv)
      .subscribe((data: PDV[]) => {
        this.pdvs = data;
        console.log(this.pdvs);
      });
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

  cargarColaboradoresActivosByNombre(nombre: string) {
    this.direccionesService
      .getColaboradoresActivosByNombrePaginado(
        nombre,
        this.pageIndex,
        this.pageSize
      )
      .subscribe({
        next: (data) => {
          this.colaboradores = data.content;
          console.log(this.colaboradores);
        },
        error: (error) => {
          console.error('Error al obtener colaboradores', error);
        },
      });
  }

  cargarTodasOtrasDirecciones() {
    this.direccionesService.getOtrasDirecciones().subscribe({
      next: (data) => {
        console.log(data);
        this.otrasDirecciones = data;
      },
      error: (error) => {
        console.error('Error al obtener otras direcciones', error);
      },
    })
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
      console.log(entradaSalidaFormulario.poblacion);
      console.log(this.entradaSalidaForm.get('poblacion')!.value);
      this.setCampoValue('provincia', entradaSalidaFormulario.provincia);
      console.log(entradaSalidaFormulario.provincia);
      console.log(this.entradaSalidaForm.get('provincia')!.value);
      this.setCampoValue('cp', entradaSalidaFormulario.cp);
      this.setCampoValue('telefono', entradaSalidaFormulario.telefono);
      this.setSalidaActualId(this.detallesES!.id || null);
    }
  }

  private actualizarProductos(productos: any[]) {
    // Limpiar el array existente
    while (this.productosControls.length) {
      this.productosControls.removeAt(0);
    }

    productos.forEach((row, index) => {
      const productoFormGroup = this.createProductoGroup();

      // Establecer todos los valores de una vez
      const valoresProducto = {
        ref: row.referencia || row.ref,
        description: row.descripcion || row.description,
        unidades: row.unidades || row.unidadesPedidas,
        unidadesPedidas: row.unidadesPedidas || row.unidades,
        ubicacion: row.ubicacion, // Preservar la ubicación original
        palets: row.palets || 0,
        bultos: row.bultos || 0,
        formaEnvio: row.formaEnvio,
        observaciones: row.observaciones,
        comprobado: row.comprobado || false,
        estado: row.estado || null,
      };

      productoFormGroup.patchValue(valoresProducto);

      // Solo buscar descripción si no está presente
      if (row.ref && !valoresProducto.description) {
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

        // Usar Promise.all para esperar a que todas las ubicaciones se carguen
        const promesasCarga = this.productosControls.controls.map(
          (control, index) => {
            const ref = control.get('ref')?.value;
            const estado = control.get('estado')?.value;
            const descripcion = control.get('description')?.value;

            return new Promise<void>((resolve) => {
              if (ref && !this.esProductoEspecial(ref)) {
                // Para productos normales, cargar estados disponibles
                this.productoService
                  .getEstadosDisponiblesPorReferencia(ref)
                  .subscribe((estados) => {
                    this.estadosDisponiblesPorProducto[index] = estados;

                    // Si ya tiene estado, cargar ubicaciones
                    if (estado) {
                      this.cargarUbicacionesPorReferenciaYEstadoConCallback(
                        ref,
                        estado,
                        index,
                        resolve
                      );
                    } else {
                      resolve();
                    }
                  });
              } else if (this.esProductoEspecial(ref) && descripcion) {
                // Para productos especiales, usar descripción
                this.obtenerUbicacionesProductoEspecial(ref, descripcion);
                resolve();
              } else {
                resolve();
              }
            });
          }
        );

        // Cuando todas las ubicaciones estén cargadas, forzar actualización
        Promise.all(promesasCarga).then(() => {
          setTimeout(() => {
            // Forzar la actualización de todos los controles de ubicación
            this.productosControls.controls.forEach((control, index) => {
              const ubicacionControl = control.get('ubicacion');
              const ubicacionGuardada = ubicacionControl?.value;

              if (ubicacionGuardada) {
                // Mantener el valor y forzar actualización visual
                ubicacionControl?.setValue(ubicacionGuardada);
                ubicacionControl?.updateValueAndValidity();
              }

              // Validar stock si es necesario
              if (this.esSalida()) {
                this.validarStockEspecifico(index);
                this.actualizarValidadoresUnidades(index);
              }
            });

            // Forzar detección de cambios
            this.cdr.detectChanges();
          }, 100);
        });
      }
    });
  }

  // Nuevo método auxiliar para cargar ubicaciones con callback
  private cargarUbicacionesPorReferenciaYEstadoConCallback(
    referencia: string,
    estado: string,
    index: number,
    callback: () => void
  ) {
    const key = `${referencia}-${estado}`;

    if (this.ubicacionesPorProductoYEstado[key]) {
      callback();
      return;
    }

    this.ubicacionesService
      .getUbicacionesByReferenciaAndEstado(referencia, estado)
      .subscribe({
        next: (data: Ubicacion[]) => {
          this.ubicacionesPorProductoYEstado[key] = data;
          callback();
        },
        error: (error) => {
          console.error(
            'Error al obtener ubicaciones por referencia y estado:',
            error
          );
          this.ubicacionesPorProductoYEstado[key] = [];
          callback();
        },
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
            estado: producto.estado || null,
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
            estado: producto.estado || null,
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

      salidaActualizada.rellena =
        this.todosLosCamposRellenos(salidaActualizada);
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
        producto.comprobado &&
        // Permitir estado null para productos especiales
        (producto.estado != null || this.esProductoEspecial(producto.ref!))
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

      // Si el PDV tiene un colaborador asociado, rellenar también el campo colaborador
      if (pdvSeleccionado.colaborador) {
        this.cargarColaboradoresActivosByNombre(
          pdvSeleccionado.colaborador.nombre!
        );
      }
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

  // Método para seleccionar una dirección
  selectPerfumeria(perfumeria: Perfumeria) {
    this.entradaSalidaForm.patchValue({
      perfumeria: perfumeria.nombre,
      otroOrigenDestino: '',
      colaborador: '',
    });

    this.perfumeriaSeleccionada = perfumeria;
    this.cargarPDVPerfumeria(perfumeria.nombre!);

    // Limpiar el dropdown inmediatamente
    this.activeCampoUnico = null;
    this.perfumerias = []; // Limpiar la lista para ocultar el dropdown
  }

  selectPdv(pdv: PDV) {
    this.entradaSalidaForm.patchValue({
      pdv: pdv.nombre,
      otroOrigenDestino: '',
      colaborador: '',
    });

    this.pdvSeleccionado = pdv;
    this.activeCampoUnico = null;
    this.pdvs = []; // Limpiar la lista
  }

  selectColaborador(colaborador: Colaborador) {
    this.entradaSalidaForm.patchValue({
      colaborador: colaborador.nombre,
      otroOrigenDestino: '',
    });

    this.colaboradorSeleccionado = colaborador;
    this.activeCampoUnico = null;
    this.colaboradores = []; // Limpiar la lista
  }

  selectOtraDireccion(direccion: OtraDireccion) {
    this.entradaSalidaForm.patchValue({
      otroOrigenDestino: direccion.nombre,
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
    this.activeCampoUnico = null;
    this.otrasDirecciones = []; // Limpiar la lista
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
    // Si llegamos aquí por Tab y el campo tiene valor, cargar las opciones
    if (this.isTabbing) {
      setTimeout(() => {
        console.log('Activamos campo único:', campo);
        this.loadOptionsForActiveField();
        this.isTabbing = false; // Reset el flag
      }, 200);
    }
  }

  clearActiveCampoUnico(): void {
    setTimeout(() => {
      console.log('Desactivamos campo único');
      this.activeCampoUnico = null;
    }, 50);
  }

  // Método para cargar opciones del campo activo
  private loadOptionsForActiveField(): void {
    if (!this.activeCampoUnico) return;

    const valorActual = this.entradaSalidaForm.get(
      this.activeCampoUnico
    )?.value;
    if (!valorActual || valorActual.trim() === '') return;

    switch (this.activeCampoUnico) {
      case 'perfumeria':
        if (!this.perfumeriaSeleccionada) {
          this.cargarPerfumerias(valorActual);
        }
        break;
      case 'pdv':
        if (!this.pdvSeleccionado) {
          const perfumeria = this.entradaSalidaForm.get('perfumeria')?.value;
          if (perfumeria) {
            this.cargarPDVsPerfumeriaByNombre(perfumeria, valorActual);
          }
        }
        break;
      case 'colaborador':
        if (!this.colaboradorSeleccionado) {
          this.cargarColaboradoresActivosByNombre(valorActual);
        }
        break;
      case 'otroOrigenDestino':
        if (!this.otraDireccionSeleccionada) {
          this.cargarOtrasDirecciones(valorActual);
        }
        break;
    }
  }

  // Modificar el método onEstadoChange para incluir la división automática
  override onEstadoChange(index: number) {
    super.onEstadoChange(index);

    // Solo ejecutar si el estado cambió realmente
    const estadoControl = this.productosControls.at(index).get('estado');
    if (estadoControl?.dirty) {
      setTimeout(() => {
        this.dividirUnidadesAutomaticamente(index);
      }, 100);
    }
  }

  // Método que se ejecute cuando se cambian las unidades
  onUnidadesBlur(index: number) {
    // Ejecutar la división automática que ya incluye deshacer divisiones anteriores
    this.dividirUnidadesAutomaticamente(index);
  }

  // Método para verificar si hay líneas con la misma referencia y estado
  private hayLineasConMismaReferenciaYEstado(index: number): boolean {
    const productoActual = this.productosControls.at(index);
    const refActual = productoActual.get('ref')?.value;
    const estadoActual = productoActual.get('estado')?.value;

    if (!refActual || this.esProductoEspecial(refActual) || !estadoActual) {
      return false;
    }

    for (let i = 0; i < this.productosControls.length; i++) {
      if (i === index) continue;

      const control = this.productosControls.at(i);
      const ref = control.get('ref')?.value;
      const estado = control.get('estado')?.value;

      if (ref === refActual && estado === estadoActual) {
        return true;
      }
    }

    return false;
  }

  // Método para obtener el total de unidades disponibles para dividir
  private getTotalUnidadesDisponibles(
    refActual: string,
    estadoActual: string,
    indexExcluir: number
  ): number {
    let total = 0;

    for (let i = 0; i < this.productosControls.length; i++) {
      if (i === indexExcluir) continue;

      const control = this.productosControls.at(i);
      const ref = control.get('ref')?.value;
      const estado = control.get('estado')?.value;
      const unidades = control.get('unidades')?.value || 0;

      if (ref === refActual && estado === estadoActual) {
        total += unidades;
      }
    }

    return total;
  }

  // Método para mostrar información sobre la división en tiempo real
  mostrarInfoDivision(index: number): string {
    const productoActual = this.productosControls.at(index);
    const refActual = productoActual.get('ref')?.value;
    const estadoActual = productoActual.get('estado')?.value;

    if (!refActual || this.esProductoEspecial(refActual) || !estadoActual) {
      return '';
    }

    const totalDisponible = this.getTotalUnidadesDisponibles(
      refActual,
      estadoActual,
      index
    );

    if (totalDisponible > 0 && this.hayLineasConMismaReferenciaYEstado(index)) {
      return `${totalDisponible} unidades disponibles para dividir`;
    }

    return '';
  }

  // Método para obtener estados disponibles (llamado desde template)
  override getEstadosDisponibles(index: number, esSalida: boolean): string[] {
    return super.getEstadosDisponibles(index, esSalida);
  }

  // Método para obtener ubicaciones por índice (llamado desde template)
  override getUbicacionesPorIndice(index: number): Ubicacion[] {
    return super.getUbicacionesPorIndice(index);
  }

  // Método para verificar si el estado es requerido (llamado desde template)
  override esEstadoRequerido(index: number): boolean {
    return super.esEstadoRequerido(index);
  }

  // Método para manejar cambio de ubicación (llamado desde template)
  override onUbicacionChange(index: number) {
    super.onUbicacionChange(index);
  }

  // Método para verificar si las unidades exceden el stock (llamado desde template)
  override unidadesExcedenStock(index: number): boolean {
    return super.unidadesExcedenStock(index);
  }

  // Método para obtener stock disponible (llamado desde template)
  override getStockDisponible(index: number): number {
    return super.getStockDisponible(index);
  }

  // Método para mostrar mensaje de stock disponible

  // Método para inicializar el formulario con datos existentes (en caso de edición)
  inicializarFormularioConDatos(datosExistentes: any) {
    // Cargar datos del formulario
    this.entradaSalidaForm.patchValue(datosExistentes);

    // Para cada producto, cargar las ubicaciones disponibles
    datosExistentes.productos?.forEach((producto: any, index: number) => {
      if (producto.ref && producto.estado && this.esSalida()) {
        this.cargarUbicacionesPorReferenciaYEstado(
          producto.ref,
          producto.estado,
          index
        );
      }
    });

    // Forzar actualización después de un delay para asegurar que las ubicaciones se carguen
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 500);
  }

  // Método para dividir unidades automáticamente
  private dividirUnidadesAutomaticamente(index: number) {
    const productoActual = this.productosControls.at(index);
    const refActual = productoActual.get('ref')?.value;
    const estadoActual = productoActual.get('estado')?.value;
    const unidadesActuales = productoActual.get('unidades')?.value || 0;

    // Solo procesar si es un producto normal (no especial) y tiene referencia y estado
    if (!refActual || this.esProductoEspecial(refActual) || !estadoActual) {
      return;
    }

    // Si hay una división previa para esta línea, deshacerla primero
    this.deshacerDivisionAnterior(index);

    // Si las unidades son 0 o menores, no hacer nada más
    if (unidadesActuales <= 0) {
      return;
    }

    // Verificar si ya se ha procesado esta división para evitar múltiples ejecuciones
    if (this.yaSeProcesoLinea(index)) {
      return;
    }

    // Buscar la primera línea con la misma referencia y estado que tenga más unidades
    let lineaOrigenIndex = -1;
    let maxUnidades = 0;

    for (let i = 0; i < this.productosControls.length; i++) {
      if (i === index) continue; // Saltar la línea actual

      const control = this.productosControls.at(i);
      const ref = control.get('ref')?.value;
      const estado = control.get('estado')?.value;
      const unidades = control.get('unidades')?.value || 0;

      if (
        ref === refActual &&
        estado === estadoActual &&
        unidades > maxUnidades
      ) {
        lineaOrigenIndex = i;
        maxUnidades = unidades;
      }
    }

    // Si encontramos una línea origen con suficientes unidades
    if (lineaOrigenIndex !== -1 && maxUnidades >= unidadesActuales) {
      const lineaOrigen = this.productosControls.at(lineaOrigenIndex);
      const nuevasUnidadesOrigen = maxUnidades - unidadesActuales;

      // Marcar como procesada antes de actualizar para evitar bucles
      this.marcarLineaComoProcesada(index);

      // Registrar la división para poder deshacerla después
      this.divisionesRealizadas.set(index, {
        lineaOrigen: lineaOrigenIndex,
        unidadesDivididas: unidadesActuales,
        refProducto: refActual,
        estadoProducto: estadoActual,
      });

      // Actualizar las unidades de la línea origen
      lineaOrigen.get('unidades')?.setValue(nuevasUnidadesOrigen);

      // Mostrar mensaje informativo
      this.snackBarExito(
        `Se dividieron ${unidadesActuales} unidades de ${refActual} (${estadoActual}) desde la línea ${
          lineaOrigenIndex + 1
        }`
      );

      console.log(
        `División automática: ${unidadesActuales} unidades movidas de línea ${
          lineaOrigenIndex + 1
        } a línea ${index + 1}`
      );

      // Limpiar la marca después de un breve delay
      setTimeout(() => {
        this.limpiarMarcaProcesada(index);
      }, 1000);
    }
  }

  private lineasProcesadas = new Set<number>();

  private yaSeProcesoLinea(index: number): boolean {
    return this.lineasProcesadas.has(index);
  }

  private marcarLineaComoProcesada(index: number) {
    this.lineasProcesadas.add(index);
  }

  private limpiarMarcaProcesada(index: number) {
    this.lineasProcesadas.delete(index);
  }

  // Limpiar las marcas al agregar o eliminar productos
  override agregarProducto() {
    super.agregarProducto();
    // Limpiar marcas ya que los índices pueden haber cambiado
    this.lineasProcesadas.clear();
  }

  override eliminarProducto(index: number) {
    // Deshacer la división si existe antes de eliminar
    this.deshacerDivisionAnterior(index);

    // Actualizar los índices de las divisiones existentes
    const divisionesActualizadas = new Map<number, any>();

    this.divisionesRealizadas.forEach((division, lineaIndex) => {
      if (lineaIndex > index) {
        // Decrementar el índice de las líneas posteriores
        divisionesActualizadas.set(lineaIndex - 1, {
          ...division,
          lineaOrigen:
            division.lineaOrigen > index
              ? division.lineaOrigen - 1
              : division.lineaOrigen,
        });
      } else if (lineaIndex < index) {
        // Mantener las líneas anteriores pero actualizar lineaOrigen si es necesario
        divisionesActualizadas.set(lineaIndex, {
          ...division,
          lineaOrigen:
            division.lineaOrigen > index
              ? division.lineaOrigen - 1
              : division.lineaOrigen,
        });
      }
      // No agregar la línea que se está eliminando (lineaIndex === index)
    });

    this.divisionesRealizadas = divisionesActualizadas;

    // Llamar al método padre
    super.eliminarProducto(index);

    // Limpiar marcas ya que los índices pueden haber cambiado
    this.lineasProcesadas.clear();
  }

  private limpiarTodasLasDivisiones() {
    this.divisionesRealizadas.clear();
    this.lineasProcesadas.clear();
  }

  override resetForm() {
    this.limpiarTodasLasDivisiones();
    super.resetForm();
  }

  // Estructura para rastrear las divisiones realizadas
  private divisionesRealizadas = new Map<
    number,
    {
      lineaOrigen: number;
      unidadesDivididas: number;
      refProducto: string;
      estadoProducto: string;
    }
  >();

  // Nuevo método para deshacer divisiones anteriores
  private deshacerDivisionAnterior(index: number) {
    const divisionAnterior = this.divisionesRealizadas.get(index);

    if (divisionAnterior) {
      // Verificar que la línea origen aún existe
      if (divisionAnterior.lineaOrigen < this.productosControls.length) {
        const lineaOrigen = this.productosControls.at(
          divisionAnterior.lineaOrigen
        );
        const refOrigen = lineaOrigen.get('ref')?.value;
        const estadoOrigen = lineaOrigen.get('estado')?.value;

        // Verificar que sigue siendo el mismo producto
        if (
          refOrigen === divisionAnterior.refProducto &&
          estadoOrigen === divisionAnterior.estadoProducto
        ) {
          const unidadesActualesOrigen =
            lineaOrigen.get('unidades')?.value || 0;
          const nuevasUnidadesOrigen =
            unidadesActualesOrigen + divisionAnterior.unidadesDivididas;

          // Devolver las unidades a la línea origen
          lineaOrigen.get('unidades')?.setValue(nuevasUnidadesOrigen);

          console.log(
            `División deshecha: ${
              divisionAnterior.unidadesDivididas
            } unidades devueltas a línea ${divisionAnterior.lineaOrigen + 1}`
          );
        }
      }

      // Eliminar el registro de la división
      this.divisionesRealizadas.delete(index);
    }
  }

  // Método para mostrar información más detallada sobre divisiones
  mostrarInfoDivisionDetallada(index: number): string {
    const productoActual = this.productosControls.at(index);
    const refActual = productoActual.get('ref')?.value;
    const estadoActual = productoActual.get('estado')?.value;

    if (!refActual || this.esProductoEspecial(refActual) || !estadoActual) {
      return '';
    }

    const division = this.divisionesRealizadas.get(index);
    if (division) {
      return `${division.unidadesDivididas} unidades tomadas de línea ${
        division.lineaOrigen + 1
      }`;
    }

    const totalDisponible = this.getTotalUnidadesDisponibles(
      refActual,
      estadoActual,
      index
    );

    if (totalDisponible > 0 && this.hayLineasConMismaReferenciaYEstado(index)) {
      return `${totalDisponible} unidades disponibles para dividir`;
    }

    return '';
  }
}
