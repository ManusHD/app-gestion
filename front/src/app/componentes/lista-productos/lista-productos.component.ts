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
      if (!grupos.has(producto.referencia!)) {
        grupos.set(producto.referencia!, {
          referencia: producto.referencia!,
          description: producto.description!,
          productos: [],
          totalStock: 0,
          expanded: false,
        });
      }

      const grupo = grupos.get(producto.referencia!)!;
      grupo.productos.push(producto);
      grupo.totalStock += producto.stock || 0;
    });

    this.productosAgrupados = Array.from(grupos.values());
  }

  copiarReferencia(referencia: string) {
    this.snackbar.snackBarExito(
      'Referencia ' + referencia + ' copiada al portapapeles'
    );
    navigator.clipboard.writeText(referencia);
  }

  // Método para iniciar la edición de descripción
  startEditing(grupo: ProductoAgrupado): void {
    this.editingReferencia = grupo.referencia;
    this.editingGrupo = { 
      ...grupo,
      description: grupo.description
    };
  }

  // Método para guardar los cambios de descripción
  saveEdit(): void {
    if (this.editingReferencia && this.editingGrupo) {
      if (!this.editingGrupo.description || this.editingGrupo.description.trim() === '') {
        this.snackbar.snackBarError('La descripción no puede estar en blanco');
        return;
      }

      this.editingGrupo.description = this.editingGrupo.description.trim();
      
      // Tomar el primer producto del grupo para hacer la actualización
      const primerProducto = this.editingGrupo.productos[0];
      
      if (!primerProducto || !primerProducto.id) {
        this.snackbar.snackBarError('Error: no se encontró producto para actualizar');
        return;
      }

      // Crear objeto con la nueva descripción
      const productoParaActualizar = {
        ...primerProducto,
        description: this.editingGrupo.description
      };

      this.productoService
        .putProducto(primerProducto.id, productoParaActualizar)
        .subscribe(
          (data: Producto) => {
            // Actualizar todos los productos del grupo en la lista local
            this.productos.forEach(producto => {
              if (producto.referencia === this.editingReferencia) {
                producto.description = data.description;
              }
            });
            
            this.cargarProductos();
            this.cancelEdit();
            this.snackbar.snackBarExito('Descripción actualizada para todos los productos de la referencia');
          },
          (error) => {
            this.snackbar.snackBarError(error.error || 'Error al actualizar la descripción');
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
  eliminarGrupoProductos(referencia: string): void {
    if (
      confirm(
        `¿Está seguro de que desea eliminar todos los productos con referencia ${referencia}? Esta acción no se puede deshacer.`
      )
    ) {
      this.productoService.eliminarGrupoProductos(referencia).subscribe(
        (response) => {
          this.snackbar.snackBarExito('Grupo de productos eliminado con éxito');
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
}