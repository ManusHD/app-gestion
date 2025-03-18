import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, finalize, takeUntil } from 'rxjs';
import { PDV } from 'src/app/models/pdv.model';
import { Perfumeria } from 'src/app/models/perfumeria.model';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { ImportarExcelService } from 'src/app/services/importar-excel.service';
import { PantallaCargaService } from 'src/app/services/pantalla-carga.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-perfumerias',
  templateUrl: './perfumerias.component.html',
  styleUrls: ['../../../../assets/styles/paginator.css', './perfumerias.component.css'],
})
export class PerfumeriasComponent implements OnInit, OnDestroy {
  currentPath = window.location.pathname;
  perfumerias: Perfumeria[] = [];
  nuevaPerfumeria: Perfumeria = { pdvs: [] };
  indexPerfumeriaSeleccionada: number = -1;
  existe: boolean = true;
  editandoId: number | null = null;
  editandoPerfumeria: Perfumeria = { pdvs: [] };
  buscador: string = '';
  pageSize = 10;
  pageIndex = 0;
  totalElementos = 0;
  buscando: boolean = false;

  // Variables para manejar la adición de Perfumerías en creación y edición
  pdvParaAgregar: string = '';
  pdvParaAgregarEdit: string = '';
  // Propiedades nuevas
  pdvs: PDV[] = [];
  pdvSeleccionado: PDV | null = null;
  pdvSeleccionadoEdit: PDV | null = null;
  PDVsSelectEdit: PDV[] = [];

  columnasPerfumerias: string[] = ['nombre', 'estado', 'pdvs', 'acciones'];
  dataSourcePerfumerias = new MatTableDataSource<Perfumeria>();
  @ViewChild(MatPaginator) paginatorPerfumerias!: MatPaginator;
    
  perfumeriasImportacion: Perfumeria[] = [];
  importando = false;
  progresoActual = 0;
  perfumeriasImportadosOK = 0;
  perfumeriasConError = 0;
  importacionCompletada = false;
  private unsubscribe$ = new Subject<void>();

  constructor(
    private importarES: ImportarExcelService,
    private perfumeriaService: DireccionesService,
    private snackbar: SnackBar,
    private carga: PantallaCargaService
  ) {}

  ngOnInit(): void {
    this.cargarPerfumerias();
    this.cargarPdvs();
    
    // Limpiar los datos de la importacion
    this.importarES.resetExcel();
    this.perfumeriasImportacion = [];

    this.importarES.excelData$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(data => {
        if (data && data.length > 0) {
          this.procesarDatosExcel(data);
        } else {
          this.pdvs = [];
          this.importacionCompletada = false;
        }
      }
    );
  }
  
    cambiarPagina(event: PageEvent) {
      this.pageIndex = event.pageIndex; 
      this.pageSize = event.pageSize;   
      if(this.buscando){
        this.buscarPerfumerias();
      } else {
        this.cargarPerfumerias();       
      }
    }

  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarPerfumerias();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.pageIndex = 0;
    this.buscando = false;
    this.cargarPerfumerias();
  }

  buscarPerfumerias() {
    this.carga.show();
    if(!this.buscando) {
      this.pageIndex = 0;
    }
    this.buscando = true;
    this.perfumeriaService
      .getPerfumeriasByNombrePaginado(this.buscador, this.pageIndex, this.pageSize)
      .subscribe((data) => {
        this.perfumerias = data.content;
        setTimeout(() => {
          this.totalElementos = data.totalElements;
        });
        this.dataSourcePerfumerias.data = this.perfumerias;
        setTimeout(() => {
          this.carga.hide();
        }); 
      });
      
  }

  cargarPerfumerias(): void {
    this.carga.show();
    this.perfumeriaService.getPerfumeriasPaginado(this.pageIndex, this.pageSize).subscribe(
      (data) => {
        this.perfumerias = data.content;
        setTimeout(() => {
          this.totalElementos = data.totalElements;
        });
        this.dataSourcePerfumerias.data = this.perfumerias;
        setTimeout(() => {
          this.carga.hide();
        }); 
      },
      (error) => {
        console.error('Error al cargar las perfumerías', error);
        setTimeout(() => {
          this.carga.hide();
        }); 
      }
    );
    
  }

  cargarPdvs() {
    this.perfumeriaService.getPdvsSinAsignar().subscribe(
      (data) => {
        this.pdvs = data;
      }
    );
  }

  crearPerfumeria(): void {
    if (
      !this.nuevaPerfumeria.nombre ||
      this.nuevaPerfumeria.nombre.trim() == ''
    ) {
      this.snackbar.snackBarError('El nombre no puede estar en blanco');
    } else {
      if (this.existe) {
        this.snackbar.snackBarError('Ya existe esta perfumería');
      } else {
        this.nuevaPerfumeria.activa = true;
        this.nuevaPerfumeria.nombre = this.nuevaPerfumeria.nombre?.trim();
        if(!this.nuevaPerfumeria.pdvs) {
          this.nuevaPerfumeria.pdvs = [];
        }
        this.carga.show();
        this.perfumeriaService.createPerfumeria(this.nuevaPerfumeria).subscribe(
          (data: Perfumeria) => {
            this.perfumerias.push(data);
            this.cargarPerfumerias();
            this.nuevaPerfumeria = { pdvs: [] };
            this.pdvParaAgregar = '';
            this.snackbar.snackBarExito('Perfumería creada con éxito');
            setTimeout(() => {
              this.carga.hide();
            }); 
          },
          (error) => {
            console.error('Error al crear la perfumería', error);
            setTimeout(() => {
              this.carga.hide();
            }); 
          }
        );
      }
    }
  }

  existePerfumeria(nombre: string) {
    if (nombre && nombre.trim() !== '') {
      this.perfumeriaService.getPerfumeria(nombre!.trim()).subscribe(
        (data: Perfumeria) => {
          if (data == null) {
            this.existe = false;
          } else {
            this.existe = true;
          }
          return this.existe;
        },
        (error) => {
          console.error(error);
          this.existe = true;
          return this.existe;
        }
      );
    }
    return true;
  }

  editarPerfumeria(perfumeria: Perfumeria): void {
    this.editandoId = perfumeria.id!;
    this.editandoPerfumeria = { ...perfumeria, pdvs: [...perfumeria.pdvs || []] };
    this.pdvParaAgregarEdit = '';
    this.obtenerPDVsSelectEdit();
  }

  guardarEdit(): void {
    if (this.editandoId && this.editandoPerfumeria) {
      if (!this.editandoPerfumeria.nombre || this.editandoPerfumeria.nombre.trim() === '') {
        this.snackbar.snackBarError('El nombre no puede estar en blanco');
        return;
      }

      this.editandoPerfumeria.nombre = this.editandoPerfumeria.nombre.trim();
      
      this.carga.show();
      this.perfumeriaService
        .updatePerfumeria(this.editandoPerfumeria)
        .subscribe(
          (data: Perfumeria) => {
            const index = this.perfumerias.findIndex((p) => p.id === data.id);
            if (index !== -1) {
              this.perfumerias[index] = data;
            }
            this.cargarPerfumerias();
            this.cancelarEdit();
            this.snackbar.snackBarExito('Perfumería actualizada con éxito');
            this.cargarPdvs();
          },
          (error) => {
            this.snackbar.snackBarError(error.error.error);
            console.error('Error al actualizar la perfumería', error);
        setTimeout(() => {
          this.carga.hide();
        }); 
          }
        );
    }
  }

  cancelarEdit(): void {
    this.editandoId = null;
    this.editandoPerfumeria = { pdvs: [] };
    this.cargarPerfumerias();
  }

  eliminarPerfumeria(id: number): void {
    this.carga.show();
    this.perfumeriaService.deletePerfumeria(id).subscribe(
      () => {
        this.cargarPerfumerias(); 
        this.snackbar.snackBarExito('Perfumería eliminada con éxito');
      },
      (error) => {
        console.error('Error al eliminar la perfumería', error);
        setTimeout(() => {
          this.carga.hide();
        }); 
      }
    );
  }

  obtenerPDVsSelectEdit() {
    const idsPDVsPerfumeria = new Set(this.editandoPerfumeria.pdvs.map(pdv => pdv.id));

    this.PDVsSelectEdit = this.pdvs.filter(pdv => !idsPDVsPerfumeria.has(pdv.id));
  }

  // MÉTODOS PARA MANEJAR PERFUMERÍAS EN MODO CREACIÓN

  agregarPdv(): void {
    if (this.pdvSeleccionado) {
      if (!this.nuevaPerfumeria.pdvs) {
        this.nuevaPerfumeria.pdvs = [];
      }
      // Evitar duplicados
      const existe = this.nuevaPerfumeria.pdvs.some(
        (p) => p.id === this.pdvSeleccionado!.id
      );
      if (!existe) {
        this.nuevaPerfumeria.pdvs.push(this.pdvSeleccionado);
        this.obtenerPDVsSelectEdit();
      }
      // Reiniciamos el select
      this.pdvSeleccionado = null;
    }
  }

  eliminarPdvDeNuevo(index: number): void {
    if (
      this.nuevaPerfumeria.pdvs &&
      index >= 0 &&
      index < this.nuevaPerfumeria.pdvs.length
    ) {
      this.nuevaPerfumeria.pdvs.splice(index, 1);
    }
  }

  // MÉTODOS PARA MANEJAR PERFUMERÍAS EN MODO EDICIÓN

  agregarPdvEdit() {
    if (this.pdvSeleccionadoEdit && this.editandoPerfumeria.id) {
      this.carga.show();
      this.perfumeriaService
        .nuevoPdvPerfumeria(
          this.editandoPerfumeria.id,
          this.pdvSeleccionadoEdit
        )
        .subscribe(
          (data: Perfumeria) => {
            this.editandoPerfumeria = data;
            const index = this.perfumerias.findIndex((p) => p.id === data.id);
            if (index !== -1) {
              this.perfumerias[index] = data;
            }
            this.pdvSeleccionadoEdit = null;
            this.snackbar.snackBarExito('PDV agregado con éxito');
        this.obtenerPDVsSelectEdit();
        setTimeout(() => {
          this.carga.hide();
        }); 
          },
          (error) => {
            console.error('Error al agregar EL PDV', error);
            this.snackbar.snackBarError('Error al agregar el PDV');
            setTimeout(() => {
              this.carga.hide();
            }); 
          }
        );
    }
  }

  eliminarPdvDeEdit(index: number): void {
    if (
      this.editandoPerfumeria.id &&
      this.editandoPerfumeria.pdvs &&
      index >= 0 &&
      index < this.editandoPerfumeria.pdvs.length
    ) {
      this.carga.show();
      const pdvAEliminar = this.editandoPerfumeria.pdvs[index];
      this.perfumeriaService
        .eliminarPdvPerfumeria(this.editandoPerfumeria.id, pdvAEliminar)
        .subscribe(
          (data: Perfumeria) => {
            this.editandoPerfumeria = data;
            const idx = this.pdvs.findIndex((p) => p.id === data.id);
            if (idx !== -1) {
              this.perfumerias[idx] = data;
            }
            this.snackbar.snackBarExito('PDV eliminado con éxito');
            setTimeout(() => {
              this.carga.hide();
            }); 
          },
          (error) => {
            console.error('Error al eliminar la perfumería', error);
            this.snackbar.snackBarError('Error al eliminar la perfumería');
            setTimeout(() => {
              this.carga.hide();
            }); 
          }
        );
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  procesarDatosExcel(data: any[]): void {
    this.perfumeriasImportacion = data.map(row => {
      const perfumeria: Perfumeria = new Perfumeria();
      // Mapear las propiedades desde el Excel a nuestro modelo
      perfumeria.nombre = row.nombre || '';
      perfumeria.activa = true;
      return perfumeria;
    });

    // Reset de los valores de importación
    this.progresoActual = 0;
    this.perfumeriasImportadosOK = 0;
    this.perfumeriasConError = 0;
    this.importacionCompletada = false;
  }

  importarPerfumerias(): void {
    if (this.perfumeriasImportacion.length === 0) return;

    this.importando = true;
    this.progresoActual = 0;
    this.perfumeriasImportadosOK = 0;
    this.perfumeriasConError = 0;
    
    // Importar PDVs de uno en uno
    this.importarSiguientePerfumeria();
  }

  importarSiguientePerfumeria(): void {
    if (this.progresoActual >= this.perfumeriasImportacion.length) {
      this.finalizarImportacion();
      return;
    }

    const perfumeriaActual = this.perfumeriasImportacion[this.progresoActual];
    
    this.perfumeriaService.createPerfumeria(perfumeriaActual)
      .pipe(
        finalize(() => {
          this.progresoActual++;
          // Continuar con el siguiente PDV
          setTimeout(() => this.importarSiguientePerfumeria(), 100); // Pequeño delay para evitar sobrecarga
        })
      )
      .subscribe({
        next: (response) => {
          this.perfumeriasImportadosOK++;
        },
        error: (error) => {
          console.error('Error al importar PDV:', error);
          this.perfumeriasConError++;
        }
      });
  }

  finalizarImportacion(): void {
    this.importando = false;
    this.importacionCompletada = true;
    
    if (this.perfumeriasConError === 0) {
      this.snackbar.snackBarExito(`Se han importado ${this.perfumeriasImportadosOK} Perfumerias correctamente`);
      this.perfumerias = this.perfumeriasImportacion;
    } else {
      this.snackbar.snackBarError(`Importación con errores: ${this.perfumeriasImportadosOK} Perfumerias correctas, ${this.perfumeriasConError} con errores`);
    }
  }

  cancelarImportacion(): void {
    if (this.importando) {
      // Si está en proceso, cancelamos
      this.importando = false;
      this.snackbar.snackBarError('Importación cancelada');
    }
    
    // Limpiar los datos
    this.importarES.resetExcel();
    this.perfumeriasImportacion = [];
    this.importacionCompletada = false;
  }


}
