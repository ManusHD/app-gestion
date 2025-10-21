import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PlantillaCorreo } from 'src/app/models/plantilla-correo.model';

@Component({
  selector: 'app-vista-previa-plantilla',
  templateUrl: './vista-previa-plantilla.component.html',
  styleUrls: [ 
    '../../../assets/styles/modal.css', 
    './vista-previa-plantilla.component.css' ]
})
export class VistaPreviaPlantillaComponent {
  mostrarModal: boolean = false;
  @Input() data!: PlantillaCorreo;

  constructor(
    
  ) {}
  
  mostrarDetalles() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
}