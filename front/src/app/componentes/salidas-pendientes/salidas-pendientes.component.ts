import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { throwError, catchError } from 'rxjs';
import { Salida } from 'src/app/models/salida.model';
import { FormularioEntradaSalidaService } from 'src/app/services/formulario-entrada-salida.service';

@Component({
  selector: 'app-salidas-pendientes',
  templateUrl: './salidas-pendientes.component.html',
  styleUrls: [
    '../../../assets/styles/paginator.css',
    './salidas-pendientes.component.css',
  ],
})
export class SalidasPendientesComponent
  extends FormularioEntradaSalidaService
  implements OnInit
{
  salidas: Salida[] = [];
  columnasPaginator: string[] = ['destino', 'preparado', 'acciones'];
  dataSource = new MatTableDataSource<Salida>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    this.cargarSalidas();
  }
      
  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarSalidas();
  }

  cargarSalidas() {
    this.carga.show();
    this.salidaService.getSalidasByEstadoRellenaPaginado(false, false, this.pageIndex, this.pageSize).subscribe((data) => {
      this.salidas = data.content; // Filtra las salidas con rellena = false
      setTimeout(() => {
        this.totalElementos = data.totalElements; // Ajusta el total de elementos visibles
      });
      this.dataSource.data = this.salidas;
      console.log(this.dataSource.data);
      console.log(data)
      this.cdr.detectChanges();
      setTimeout(() => {
        this.carga.hide();
      });
    });
  }
  
  handleRellena(salida: Salida, isRellena: boolean): void {
    // Actualizamos el valor de la propiedad en el objeto salida
    salida.rellena = isRellena;
  
    if (isRellena) {
      this.salidas = this.salidas.filter(item => item.id !== salida.id);
      this.dataSource.data = this.salidas;
      this.totalElementos = this.salidas.length;
      this.cdr.detectChanges();
    }
  }
  
  deleteSalida(idSalida: number) {
    this.carga.show();
    this.btnSubmitActivado = false;
    this.salidaService.deleteSalida(idSalida).subscribe(
      (data) => {
        this.carga.hide();
        this.cargarSalidas();
        console.log('Salida borrada con éxito');
        this.snackBarExito('Salida borrada con éxito');
        this.btnSubmitActivado = true;
      },
      (error) => {
        this.carga.hide();
        this.btnSubmitActivado = true;
        console.error(error);
        this.snackBarError('No se puede borrar la salida por un conflicto en la BBDD');
      }
    );
  }
}
