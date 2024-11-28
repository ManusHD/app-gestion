import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar  } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Entrada } from 'src/app/models/entradas.model';
import { ProductoEntrada } from 'src/app/models/productoEntrada';
import { EntradaServices } from 'src/app/services/entradas.service';

@Component({
  selector: 'app-detalles-entradas',
  templateUrl: './detalles-entradas.component.html',
  styleUrls: ['./detalles-entradas.component.css'],
})
export class DetallesEntradasComponent implements OnInit {
  mostrarModal: boolean = false;
  @Input() enRecibidas: boolean = false;
  @Input() entrada!: Entrada;
  @Output() entradaRellena = new EventEmitter<boolean>();

  private snackBar = inject(MatSnackBar);

  constructor(private entradaServices: EntradaServices, ) {}

  ngOnInit() {
    if(!this.enRecibidas) {
      this.iniciarBultos();
    }
  }

  modificarEntrada() {
    this.entradaServices.updateEntrada(this.entrada.id!, this.entrada).subscribe({
      next: (updatedEntrada) => {
        console.log('Entrada actualizada:', updatedEntrada);
        this.entradaRellena.emit(this.todosLosCamposRellenos());
        this.snackBar.open('Entrada guardada correctamente', '✖', {
          duration: 3000,
          panelClass: 'exito'
        });
      },
      error: (err) => {
        console.error('Error al actualizar la entrada:', err);
        this.snackBar.open('Error al guardar la entrada: ' + err, '✖', {
          duration: 3000,
          panelClass: 'error'
        });
      },
    });
  }

  iniciarBultos() {
    this.entrada.productos!.forEach((producto) => {
      producto.bultos = 1;
    });
  }

  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  actualizarFecha(fecha: Date) {
    this.entrada.productos!.forEach((producto) => {
      producto.fechaRecepcion = fecha;
    });
  }

  todosLosCamposRellenos(): boolean {
    return this.entrada.productos!.every(
      (producto) =>
        producto.description &&
        producto.unidades != null &&
        producto.fechaRecepcion &&
        producto.ubicacion &&
        producto.palets != null &&
        producto.bultos != null
    );
  }

}
