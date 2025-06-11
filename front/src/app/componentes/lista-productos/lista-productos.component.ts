import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject } from 'rxjs';
import { Estado } from 'src/app/models/estado.model';
import { MigrarEstadoDTO } from 'src/app/models/MigrarEstadoDTO';
import { Producto } from 'src/app/models/producto.model';
import { ProductoAgrupado } from 'src/app/models/ProductoAgrupado.interface';
import { TransferirEstadoDTO } from 'src/app/models/TransferirEstadoDTO.interface';
import { EstadoService } from 'src/app/services/estado.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-lista-productos',
  templateUrl: './lista-productos.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './lista-productos.component.css',
  ],
})
export class ListaProductosComponent implements OnInit {
  currentPath = window.location.pathname;
  productos: Producto[] = [];
  tipoBusqueda: string = 'referencias';
  buscador: string = '';
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  buscando: boolean = false;

  productosAgrupados: ProductoAgrupado[] = [];
  estados: Estado[] = [];

  private productosParaExportarSubject = new BehaviorSubject<Producto[]>([]);
  productosParaExportar$ = this.productosParaExportarSubject.asObservable();

  // Propiedades para la edición en línea (solo descripción)
  editingReferencia: string | null = null;
  editingGrupo: ProductoAgrupado = {} as ProductoAgrupado;

  columnasStock: string[] = [
    'referencia',
    'description',
    'estados',
    'totalStock',
  ];
  dataSourceStock = new MatTableDataSource<ProductoAgrupado>();

  @ViewChild(MatPaginator) paginatorStock!: MatPaginator;

  constructor(
    private productoService: ProductoServices,
    private estadoService: EstadoService,
    private snackbar: SnackBar,
    private carga: PantallaCargaService
  ) {}

  ngOnInit(): void {
    this.cargarEstados();
    this.cargarProductos();
    if (this.currentPath == '/productos') {
      this.columnasStock = [
        'referencia',
        'description',
        'estados',
        'totalStock',
        'acciones',
      ];
    } else {
      this.columnasStock = [
        'referencia',
        'description',
        'estados',
        'totalStock',
      ];
    }
  }

  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    if (this.buscando) {
      this.buscarProductos();
    } else {
      this.cargarProductos();
    }
  }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarProductos();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarProductos();
  }

  buscarProductos() {
    this.carga.show();
    if (!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;

    if (this.tipoBusqueda === 'referencias') {
      this.productoService
        .getProductosPorReferenciaPaginado(
          this.buscador,
          this.pageIndex,
          this.pageSize
        )
        .subscribe(
          (data) => {
            this.productos = data.content;
            this.agruparProductos(); // AGREGAR AQUÍ
            setTimeout(() => {
              this.totalElementos = data.totalElements;
            });
            this.dataSourceStock.data = this.productosAgrupados; // CAMBIAR AQUÍ
            setTimeout(() => {
              this.carga.hide();
            });
          },
          () => {
            setTimeout(() => {
              this.carga.hide();
            });
          }
        );
    } else if (this.tipoBusqueda === 'descripciones') {
      this.productoService
        .getProductosPorDescripcionPaginado(
          this.buscador,
          this.pageIndex,
          this.pageSize
        )
        .subscribe(
          (data) => {
            this.productos = data.content;
            this.agruparProductos(); // AGREGAR AQUÍ
            setTimeout(() => {
              this.totalElementos = data.totalElements;
            });
            this.dataSourceStock.data = this.productosAgrupados; // CAMBIAR AQUÍ
            setTimeout(() => {
              this.carga.hide();
            });
          },
          () => {
            setTimeout(() => {
              this.carga.hide();
            });
          }
        );
    }
  }

  cargarEstados() {
    this.estadoService.getEstados().subscribe(
      (data: Estado[]) => {
        this.estados = data;
      },
      (error) => {
        console.error('Error al cargar estados', error);
      }
    );
  }

  cargarProductos() {
    this.carga.show();
    this.productoService
      .getProductosPaginado(this.pageIndex, this.pageSize)
      .subscribe(
        (data) => {
          this.productos = data.content;
          this.agruparProductos();
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSourceStock.data = this.productosAgrupados;
          setTimeout(() => {
            this.carga.hide();
          });
        },
        () => {
          setTimeout(() => {
            this.carga.hide();
          });
        }
      );
  }

  agruparProductos() {
    const grupos = new Map<string, ProductoAgrupado>();

    this.productos.forEach((producto) => {
      // Determinar la clave de agrupación según el tipo de producto
      let claveAgrupacion: string;
      let referenciaDisplay: string;

      if (this.esProductoEspecial(producto.referencia!)) {
        // Para productos especiales: agrupar por descripción
        claveAgrupacion = `${producto.referencia}_${producto.description}`;
        referenciaDisplay = producto.description!; // Mostrar descripción como "referencia"
      } else {
        // Para productos normales: agrupar por referencia
        claveAgrupacion = producto.referencia!;
        referenciaDisplay = producto.referencia!;
      }

      if (!grupos.has(claveAgrupacion)) {
        grupos.set(claveAgrupacion, {
          referencia: referenciaDisplay, // Usar referenciaDisplay
          description: this.esProductoEspecial(producto.referencia!)
            ? `Tipo: ${producto.referencia}` // Para especiales, mostrar el tipo
            : producto.description!, // Para normales, mostrar descripción
          productos: [],
          totalStock: 0,
          expanded: false,
          // Agregar propiedades adicionales para identificar productos especiales
          esEspecial: this.esProductoEspecial(producto.referencia!),
          referenciaOriginal: producto.referencia!, // Guardar referencia original
        });
      }

      const grupo = grupos.get(claveAgrupacion)!;
      grupo.productos.push(producto);
      grupo.totalStock += producto.stock || 0;
    });

    this.productosAgrupados = Array.from(grupos.values());
  }

  // Método helper para identificar productos especiales
  private esProductoEspecial(referencia: string): boolean {
    return referencia === 'VISUAL' || referencia === 'SIN REFERENCIA';
  }

  // Método para copiar referencia actualizado
  copiarReferencia(grupo: ProductoAgrupado) {
    const textoACopiar = grupo.esEspecial
      ? `${grupo.referenciaOriginal} - ${grupo.referencia}` // Para especiales: "VISUAL - Descripción del producto"
      : grupo.referencia; // Para normales: solo la referencia

    this.snackbar.snackBarExito(
      'Referencia copiada al portapapeles: ' + textoACopiar
    );
    navigator.clipboard.writeText(textoACopiar);
  }

  // Método para editar actualizado
  startEditing(grupo: ProductoAgrupado): void {
    // Para productos especiales, usar la descripción original
    const referenciaParaEdicion = grupo.esEspecial
      ? grupo.referencia // Para especiales, usar la descripción como clave
      : grupo.referencia; // Para normales, usar la referencia

    this.editingReferencia = referenciaParaEdicion;
    this.editingGrupo = {
      ...grupo,
      description: grupo.esEspecial ? grupo.referencia : grupo.description, // Ajustar según el tipo
    };
  }

  // Método para guardar edición actualizado
  saveEdit(): void {
    if (this.editingReferencia && this.editingGrupo) {
      if (
        !this.editingGrupo.description ||
        this.editingGrupo.description.trim() === ''
      ) {
        this.snackbar.snackBarError('La descripción no puede estar en blanco');
        return;
      }

      this.editingGrupo.description = this.editingGrupo.description.trim();

      // Tomar el primer producto del grupo para hacer la actualización
      const primerProducto = this.editingGrupo.productos[0];

      if (!primerProducto || !primerProducto.id) {
        this.snackbar.snackBarError(
          'Error: no se encontró producto para actualizar'
        );
        return;
      }

      // Para productos especiales, actualizar la descripción
      // Para productos normales, actualizar la descripción del grupo
      const nuevaDescripcion = this.editingGrupo.esEspecial
        ? this.editingGrupo.description // Para especiales: actualizar descripción individual
        : this.editingGrupo.description; // Para normales: actualizar descripción del grupo

      const productoParaActualizar = {
        ...primerProducto,
        description: nuevaDescripcion,
      };

      this.productoService
        .putProducto(primerProducto.id, productoParaActualizar)
        .subscribe(
          (data: Producto) => {
            // Actualizar productos en la lista local
            if (this.editingGrupo.esEspecial) {
              // Para especiales: solo actualizar el producto específico
              this.productos.forEach((producto) => {
                if (producto.id === primerProducto.id) {
                  producto.description = data.description;
                }
              });
            } else {
              // Para normales: actualizar todos los productos del grupo
              this.productos.forEach((producto) => {
                if (
                  producto.referencia === this.editingGrupo.referenciaOriginal
                ) {
                  producto.description = data.description;
                }
              });
            }

            this.cargarProductos();
            this.cancelEdit();

            const mensaje = this.editingGrupo.esEspecial
              ? 'Descripción actualizada para el producto específico'
              : 'Descripción actualizada para todos los productos de la referencia';
            this.snackbar.snackBarExito(mensaje);
          },
          (error) => {
            this.snackbar.snackBarError(
              error.error || 'Error al actualizar la descripción'
            );
            console.error('Error al actualizar el producto', error);
          }
        );
    }
  }

  // Método para cancelar la edición
  cancelEdit(): void {
    this.editingReferencia = null;
    this.editingGrupo = {} as ProductoAgrupado;
  }

  // Verificar si un grupo está en edición
  isEditingGroup(referencia: string): boolean {
    return this.editingReferencia === referencia;
  }

  // Elimina todos los productos de una referencia
  // Método para eliminar grupo actualizado
  eliminarGrupoProductos(grupo: ProductoAgrupado): void {
    const identificador = grupo.esEspecial
      ? grupo.referencia
      : grupo.referencia;
    const tipoProducto = grupo.esEspecial
      ? 'producto especial'
      : 'grupo de productos';

    if (
      confirm(
        `¿Está seguro de que desea eliminar el ${tipoProducto} "${identificador}"? Esta acción no se puede deshacer.`
      )
    ) {
      if (grupo.esEspecial) {
        // Para productos especiales: eliminar solo ese producto específico
        const primerProducto = grupo.productos[0];
        if (primerProducto && primerProducto.id) {
          this.productoService.deleteProducto(primerProducto.id).subscribe(
            (response) => {
              this.snackbar.snackBarExito(
                'Producto especial eliminado con éxito'
              );
              this.cargarProductos();
            },
            (error) => {
              this.snackbar.snackBarError(
                error.error || 'Error al eliminar el producto especial'
              );
              console.error('Error al eliminar el producto especial', error);
            }
          );
        }
      } else {
        // Para productos normales: eliminar todo el grupo por referencia
        this.productoService
          .eliminarGrupoProductos(grupo.referenciaOriginal!)
          .subscribe(
            (response) => {
              this.snackbar.snackBarExito(
                'Grupo de productos eliminado con éxito'
              );
              this.cargarProductos();
            },
            (error) => {
              this.snackbar.snackBarError(
                error.error || 'Error al eliminar el grupo de productos'
              );
              console.error('Error al eliminar el grupo de productos', error);
            }
          );
      }
    }
  }

  obtenerDatosAExportar() {
    this.productosParaExportarSubject.next(this.productos);
    if (this.buscando) {
      if (this.tipoBusqueda === 'referencias') {
        this.productoService
          .getProductosPorReferencia(this.buscador)
          .subscribe((data) => {
            this.productosParaExportarSubject.next(data);
          });
      } else if (this.tipoBusqueda === 'descripciones') {
        this.productoService
          .getProductosPorDescripcion(this.buscador)
          .subscribe((data) => {
            this.productosParaExportarSubject.next(data);
          });
      }
    } else {
      this.productoService.getProductos().subscribe((data) => {
        this.productosParaExportarSubject.next(data);
      });
    }
  }

  // Función helper para formatear estados
  formatearEstado(estado: string | null | undefined): string {
    return estado || 'SIN ESTADO';
  }

  get hayEspeciales(): boolean {
      return Array.isArray(this.productosAgrupados) && this.productosAgrupados.some(g => g && g.esEspecial);
  }

  get hayEspecialesEnAgrupados(): boolean {
    return Array.isArray(this.productosAgrupados) && this.productosAgrupados.some(g => g && g.esEspecial);
  }
}
