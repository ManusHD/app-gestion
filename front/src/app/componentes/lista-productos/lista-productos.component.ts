import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject } from 'rxjs';
import { Producto } from 'src/app/models/producto.model';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-lista-productos',
  templateUrl: './lista-productos.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './lista-productos.component.css'
  ]
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
    
  private productosParaExportarSubject = new BehaviorSubject<Producto[]>([]);
  productosParaExportar$ = this.productosParaExportarSubject.asObservable();

  // Propiedades para la edición en línea
  editingId: number | null = null;
  editingProducto: Producto = {};

  columnasStock: string[] = ['referencia', 'description', 'stock'];
  dataSourceStock = new MatTableDataSource<Producto>();
  @ViewChild(MatPaginator) paginatorStock!: MatPaginator;

  constructor(
    private productoService: ProductoServices,
    private snackbar: SnackBar,
    private carga: PantallaCargaService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    if(this.currentPath == '/productos') {
      this.columnasStock.push('acciones');
    }
  }

  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex; 
    this.pageSize = event.pageSize;   
    if(this.buscando){
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
    if(!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;
    if (this.tipoBusqueda === 'referencias') {
      this.productoService
        .getProductosPorReferenciaPaginado(this.buscador, this.pageIndex, this.pageSize)
        .subscribe((data) => {
          this.productos = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSourceStock.data = this.productos;
          setTimeout(() => {
            this.carga.hide();
          }); 
        },
        () => {
          setTimeout(() => {
            this.carga.hide();
          }); 
        }
      )
    } else if(this.tipoBusqueda === 'descripciones'){
      this.productoService
        .getProductosPorDescripcionPaginado(this.buscador, this.pageIndex, this.pageSize)
        .subscribe((data) => {
          this.productos = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
          this.dataSourceStock.data = this.productos;
          setTimeout(() => {
            this.carga.hide();
          }); 
        },
        () => {
          setTimeout(() => {
            this.carga.hide();
          }); 
        }
      )
    }
  }

  cargarProductos() {
    this.carga.show();
    this.productoService
      .getProductosPaginado(this.pageIndex, this.pageSize)
      .subscribe((data) => {
        this.productos = data.content;
          setTimeout(() => {
            this.totalElementos = data.totalElements;
          });
        this.dataSourceStock.data = this.productos;
        setTimeout(() => {
          this.carga.hide();
        }); 
      },
      () => {
        setTimeout(() => {
          this.carga.hide();
        }); 
      }
    )
  }

  copiarReferencia(referencia: string) {
    this.snackbar.snackBarExito(
      'Referencia ' + referencia + ' copiada al portapapeles'
    );
    navigator.clipboard.writeText(referencia);
  }

  // Método para iniciar la edición
  startEditing(producto: Producto): void {
    this.editingId = producto.id!;
    this.editingProducto = { ...producto };
  }

  // Método para guardar los cambios
  saveEdit(): void {
    if (this.editingId && this.editingProducto) {
      if (!this.editingProducto.referencia || this.editingProducto.referencia.trim() === '') {
        this.snackbar.snackBarError('El nombre no puede estar en blanco');
        return;
      }

      if (!this.editingProducto.description || this.editingProducto.description.trim() === '') {
        this.snackbar.snackBarError('La descripción no puede estar en blanco');
        return;
      }

      this.editingProducto.referencia = this.editingProducto.referencia.trim();
      
      this.productoService
        .putProducto(this.editingId, this.editingProducto)
        .subscribe(
          (data: Producto) => {
            const index = this.productos.findIndex((u) => u.id === data.id);
            if (index !== -1) {
              this.productos[index] = data;
            }
            this.cargarProductos();
            this.cancelEdit();
            this.snackbar.snackBarExito('Producto actualizado con éxito');
          },
          (error) => {
            this.snackbar.snackBarError(error.message);
            console.error('Error al actualizar el producto', error);
          }
        );
    }
  }

  // Método para cancelar la edición
  cancelEdit(): void {
    this.editingId = null;
    this.editingProducto = {};
  }

  eliminarProducto(id: number): void {
    this.productoService.deleteProducto(id).subscribe(
      () => {
        this.productos = this.productos.filter((u) => u.id !== id);
        this.dataSourceStock.data = [...this.productos];
        this.snackbar.snackBarExito('Producto eliminado con éxito');
      },
      (error) => {
        this.snackbar.snackBarError('Error al eliminar el producto');
        console.error('Error al eliminar el producto', error);
      }
    );
  }

  obtenerDatosAExportar() {
    // Inicia con un arreglo vacío o los datos actuales de la página
    this.productosParaExportarSubject.next(this.productos);
    if (this.buscando) {
      if (this.tipoBusqueda === 'referencias') {
        this.productoService.getProductosPorReferencia(this.buscador)
        .subscribe(data => {
          this.productosParaExportarSubject.next(data);
        });
      } else if(this.tipoBusqueda === 'descripciones') {
        this.productoService.getProductosPorDescripcion(this.buscador)
        .subscribe(data => {
          this.productosParaExportarSubject.next(data);
        });
      }
    } else {
      this.productoService.getProductos()
      .subscribe(data => {
        console.log(data)
          this.productosParaExportarSubject.next(data);
        });
    }
  }


}

