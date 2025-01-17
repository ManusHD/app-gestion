import { Component, Input } from '@angular/core';
import { dcs } from 'src/app/models/dcs.model';

@Component({
  selector: 'app-detalles-dcs',
  templateUrl: './detalles-dcs.component.html',
  styleUrls: ['../../../assets/styles/modal.css', './detalles-dcs.component.css']
})
export class DetallesDcsComponent {
  mostrarModal: boolean = false;
  @Input() dcs!: dcs;


  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
}
