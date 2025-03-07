import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { finalize, Subject, takeUntil } from 'rxjs';
import { PDV } from 'src/app/models/pdv.model';
import { Perfumeria } from 'src/app/models/perfumeria.model';
import { DireccionesService } from 'src/app/services/direcciones.service';
import { ImportarExcelService } from 'src/app/services/importar-excel.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-pdvs',
  templateUrl: './pdvs.component.html',
  styleUrls: [
    '../../../../assets/styles/paginator.css', 
    './pdvs.component.css'
  ], 
})
export class PdvsComponent implements OnInit, OnDestroy {
  currentPath = window.location.pathname;
  pdvs: PDV[] = [];
  // Inicializamos el nuevo PDV con un array vacío de Perfumerías
  nuevoPdv: PDV = {};
  pdvSeleccionado: PDV | null = null;
  pdvEditar: PDV | null = null;
  indexPdvSeleccionado: number = -1;
  existe: boolean = true;
  editandoId: number | null = null;
  editandoPdv: PDV = {};
  buscador: string = '';
  
  pdvsImportacion: PDV[] = [];
  importando = false;
  progresoActual = 0;
  pdvsImportadosOK = 0;
  pdvsConError = 0;
  importacionCompletada = false;
  private unsubscribe$ = new Subject<void>();

  columnasPdvs: string[] = [
    'nombre',
    'telefono',
    'direccion',
    'acciones',
  ];
  dataSourcePdvs = new MatTableDataSource<PDV>();

  @ViewChild(MatPaginator) paginatorPdvs!: MatPaginator;

  constructor(
    private importarES: ImportarExcelService,
    private direccionesService: DireccionesService,
    private snackbar: SnackBar
  ) {}

  ngOnInit(): void {
    this.cargarPdvs();
    
    // Limpiar los datos de la importacion
    this.importarES.resetExcel();
    this.pdvsImportacion = [];

    this.importarES.excelData$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(data => {
        if (data && data.length > 0) {
          this.procesarDatosExcel(data);
        } else {
          this.pdvs = [];
          this.importacionCompletada = false;
        }
      });
  }

  // Manejo de la tecla Enter en el buscador
  onEnterKey(event: any) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.buscarPdvs();
    } else if (this.buscador === '') {
      this.resetearBuscador();
    }
  }

  resetearBuscador() {
    this.buscador = '';
    this.cargarPdvs();
  }

  buscarPdvs() {
    this.direccionesService.getPdvsByNombre(this.buscador).subscribe(
      (data: PDV[]) => {
        this.pdvs = data;
        this.dataSourcePdvs.data = this.pdvs;
        this.dataSourcePdvs.paginator = this.paginatorPdvs;
      },
      (error) => {
        console.error('Error al buscar PDVs', error);
      }
    );
  }

  cargarPdvs(): void {
    this.direccionesService.getPdvs().subscribe(
      (data: PDV[]) => {
        this.pdvs = data;
        this.dataSourcePdvs.data = this.pdvs;
        this.dataSourcePdvs.paginator = this.paginatorPdvs;
      },
      (error) => {
        console.error('Error al cargar PDVs', error);
      }
    );
  }

  crearPdv(): void {
    if (!this.nuevoPdv.nombre || this.nuevoPdv.nombre.trim() === '') {
      this.snackbar.snackBarError('El nombre no puede estar en blanco');
    } else {
      if (this.existe) {
        this.snackbar.snackBarError('Ya existe este PDV');
      } else {
        this.nuevoPdv.nombre = this.nuevoPdv.nombre.trim();
        this.direccionesService.createPdv(this.nuevoPdv).subscribe(
          (data: PDV) => {
            this.pdvs.push(data);
            this.cargarPdvs();
            // Reiniciamos el formulario de creación
            this.nuevoPdv = {};
            this.snackbar.snackBarExito('PDV creado con éxito');
          },
          (error) => {
            console.error('Error al crear el PDV', error);
          }
        );
      }
    }
  }

  // Verifica la existencia del PDV mediante el endpoint getPdv
  existePdv(nombre: string) {
    if (nombre && nombre.trim() !== '') {
      this.direccionesService.getPdv(nombre.trim()).subscribe(
        (data: PDV) => {
          this.existe = data != null;
        },
        (error) => {
          console.error(error);
          this.existe = true;
        }
      );
    }
    return this.existe;
  }

  editarPdv(pdv: PDV): void {
    this.editandoId = pdv.id!;
    // Clonamos el PDV (incluyendo la lista de Perfumerías)
    this.editandoPdv = { ...pdv};
  }

  guardarEdit(): void {
    if (this.editandoId && this.editandoPdv) {
      if (!this.editandoPdv.nombre || this.editandoPdv.nombre.trim() === '') {
        this.snackbar.snackBarError('El nombre no puede estar en blanco');
        return;
      }
      this.editandoPdv.nombre = this.editandoPdv.nombre.trim();
      this.direccionesService
        .updatePdv(this.editandoId, this.editandoPdv)
        .subscribe(
          (data: PDV) => {
            const index = this.pdvs.findIndex((p) => p.id === data.id);
            if (index !== -1) {
              this.pdvs[index] = data;
            }
            this.cargarPdvs();
            this.cancelarEdit();
            this.snackbar.snackBarExito('PDV actualizado con éxito');
          },
          (error) => {
            this.snackbar.snackBarError(error.error.message);
            console.error('Error al actualizar el PDV', error);
          }
        );
    }
  }

  cancelarEdit(): void {
    this.editandoId = null;
    this.editandoPdv = {};
  }

  eliminarPdv(id: number): void {
    this.direccionesService.deletePdv(id).subscribe(
      () => {
        this.pdvs = this.pdvs.filter((p) => p.id !== id);
        this.dataSourcePdvs.data = [...this.pdvs];
      },
      (error) => {
        console.error('Error al eliminar el PDV', error);
      }
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  procesarDatosExcel(data: any[]): void {
    this.pdvsImportacion = data.map(row => {
      const pdv: PDV = new PDV();
      // Mapear las propiedades desde el Excel a nuestro modelo
      pdv.nombre = row.nombre || '';
      pdv.direccion = row.direccion || '';
      pdv.poblacion = row.poblacion || '';
      pdv.provincia = row.provincia || '';
      pdv.cp = row.cp || '';
      pdv.telefono = row.telefono || '';
      return pdv;
    });

    // Reset de los valores de importación
    this.progresoActual = 0;
    this.pdvsImportadosOK = 0;
    this.pdvsConError = 0;
    this.importacionCompletada = false;
  }

  importarPDVs(): void {
    if (this.pdvsImportacion.length === 0) return;

    this.importando = true;
    this.progresoActual = 0;
    this.pdvsImportadosOK = 0;
    this.pdvsConError = 0;
    
    // Importar PDVs de uno en uno
    this.importarSiguientePDV();
  }

  importarSiguientePDV(): void {
    if (this.progresoActual >= this.pdvsImportacion.length) {
      this.finalizarImportacion();
      return;
    }

    const pdvActual = this.pdvsImportacion[this.progresoActual];
    
    this.direccionesService.createPdv(pdvActual)
      .pipe(
        finalize(() => {
          this.progresoActual++;
          // Continuar con el siguiente PDV
          setTimeout(() => this.importarSiguientePDV(), 100); // Pequeño delay para evitar sobrecarga
        })
      )
      .subscribe({
        next: (response) => {
          this.pdvsImportadosOK++;
        },
        error: (error) => {
          console.error('Error al importar PDV:', error);
          this.pdvsConError++;
        }
      });
  }

  finalizarImportacion(): void {
    this.importando = false;
    this.importacionCompletada = true;
    
    if (this.pdvsConError === 0) {
      this.snackbar.snackBarExito(`Se han importado ${this.pdvsImportadosOK} PDVs correctamente`);
    } else {
      this.snackbar.snackBarError(`Importación con errores: ${this.pdvsImportadosOK} PDVs correctos, ${this.pdvsConError} con errores`);
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
    this.pdvsImportacion = [];
    this.importacionCompletada = false;
  }

}
