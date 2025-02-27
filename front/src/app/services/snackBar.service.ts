import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class SnackBar {
  private snackBar = inject(MatSnackBar);

  constructor() {}

  snackBarError(message: string) {
    this.snackBar.open(message, '✖', {
      duration: 8000,
      panelClass: 'error',
    });
  }

  snackBarExito(message: string) {
    this.snackBar.open(message, '✖', {
      duration: 8000,
      panelClass: 'exito',
    });
  }
}
