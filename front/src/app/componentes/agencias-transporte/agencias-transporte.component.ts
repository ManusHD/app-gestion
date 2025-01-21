import { Component, inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AgenciaTransporte } from 'src/app/models/agencia-transporte.model';
import { AgenciasTransporteService } from 'src/app/services/agencias-transporte.service';
import { SnackBar } from 'src/app/services/snackBar.service';

@Component({
  selector: 'app-agencias-transporte',
  templateUrl: './agencias-transporte.component.html',
  styleUrls: ['./agencias-transporte.component.css'],
})
export class AgenciasTransporteComponent implements OnInit {
  agencia: AgenciaTransporte = new AgenciaTransporte();
  agencias: AgenciaTransporte[] = [];
  existe: boolean = false;

  constructor(private agenciaService: AgenciasTransporteService, private snackBar: SnackBar) {}

  ngOnInit(): void {
    this.cargarAgencias();
  }

  cargarAgencias() {
    this.agenciaService.getAgenciasTransporteOrderByNombre().subscribe({
      next: (data) => {
        this.agencias = data;
      },
      error: (error) => {
        console.error('Error al obtener Agencias de Transporte', error);
        this.snackBar.snackBarError('Error al obtener Agencias de Transporte: ' + error);
      },
    });
  }

  existeAgencia() {
    if (this.agencia.nombre == '') {
      this.existe = false;
    } else {
      console.log('Agencia2: ' + this.agencia.nombre);
      this.agenciaService
        .getAgenciaTransporteByNombre(this.agencia.nombre)
        .subscribe((data) => {
          if (data != null) {
            this.existe = true;
            console.log('Existe: ', this.existe);
          } else {
            this.existe = false;
            console.log('NO existe: ', this.existe);
          }
        });
    }
  }

  onSubmit() {
    if (!this.existe) {
      console.log('Agencia a enviar: ', this.agencia);
      this.agenciaService.newAgenciaTransporte(this.agencia).subscribe({
        next: (data) => {
          console.log('Agencia creada correctamente: ', data);
          this.snackBar.snackBarExito('Agencia guardada correctamente');
          location.reload();
        },
        error: (error) => {
          console.error('Error al crear Agencia', error);
          this.snackBar.snackBarError('Error al crear la Agencia: ' + error);
        },
      });
    } else {
      this.snackBar.snackBarError('Ya existe una Agencia con este nombre');
    }
  }

  editarAgencia(agencia: AgenciaTransporte) {
    agencia.activa = !agencia.activa;
    this.agenciaService.updateAgenciaTransporte(agencia).subscribe({
      next: (data) => {
        console.log('Agencia actualizada correctamente: ', data);
        this.snackBar.snackBarExito('Agencia actualizada correctamente');
        location.reload();
      },
      error: (error) => {
        console.error('Error al actualizar Agencia', error);
        this.snackBar.snackBarError('Error al actualizar la Agencia: ' + error);
      },
    });
  }

  eliminarAgencia(id: number) {
    this.agenciaService.deleteAgenciaTransporte(id).subscribe({
      next: (data) => {
        console.log('Agencia eliminada correctamente: ', data);
        this.snackBar.snackBarExito('Agencia eliminada correctamente');
        location.reload();
      },
      error: (error) => {
        console.error('Error al eliminar Agencia', error);
        this.snackBar.snackBarError('Error al eliminar la Agencia: ' + error);
      },
    });
  }
}
