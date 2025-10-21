import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PlantillaCorreo } from 'src/app/models/plantilla-correo.model';

@Component({
  selector: 'app-vista-previa-plantilla',
  template: `
    <h2 mat-dialog-title>Vista Previa - {{ data.alias }}</h2>
    <mat-dialog-content>
      <div class="preview-asunto">
        <strong>Asunto:</strong> {{ data.asunto }}
      </div>
      <div class="preview-cuerpo" [innerHTML]="data.cuerpo"></div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cerrar()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .preview-asunto {
      padding: 10px;
      background-color: rgba(61, 126, 255, 0.1);
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .preview-cuerpo {
      padding: 20px;
      background-color: white;
      color: black;
      border-radius: 5px;
      min-height: 200px;
    }
  `]
})
export class VistaPreviaPlantillaComponent {
  constructor(
    public dialogRef: MatDialogRef<VistaPreviaPlantillaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PlantillaCorreo
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }
}