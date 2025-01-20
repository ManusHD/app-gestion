import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { Salida } from 'src/app/models/salida.model';
import { ProductoSalida } from 'src/app/models/productoSalida.model';
import { SalidaServices } from 'src/app/services/salida.service';
import { ProductoServices } from 'src/app/services/producto.service';
import { EMPTY, forkJoin, Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-salidas-nuevo',
  templateUrl: './salidas-nuevo.component.html',
  styleUrls: [
    '../detalles-salidas/detalles-salidas.component.css',
    './salidas-nuevo.component.css',
  ],
})
export class SalidasNuevoComponent {
  
}
