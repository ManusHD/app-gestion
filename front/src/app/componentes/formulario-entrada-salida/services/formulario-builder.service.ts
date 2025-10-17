import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

@Injectable()
export class FormularioBuilderService {
  constructor(private fb: FormBuilder) {}

  createForm(): FormGroup {
    return this.fb.group({
      fechaRecepcionEnvio: ['', Validators.required],
      perfumeria: [''],
      pdv: [''],
      colaborador: [''],
      otroOrigenDestino: [''],
      direccion: [''],
      poblacion: [''],
      provincia: [''],
      cp: [''],
      telefono: [''],
      dcs: [''],
      productos: this.fb.array([])
    });
  }

  createProductoGroup(): FormGroup {
    return this.fb.group({
      productoId: [null],
      ref: ['', Validators.required],
      description: ['', Validators.required],
      palets: [0, [Validators.required, Validators.min(0)]],
      bultos: [0, [Validators.required, Validators.min(0)]],
      unidadesPedidas: [0],
      unidades: ['', [Validators.required, Validators.min(1)]],
      ubicacion: ['', Validators.required],
      formaEnvio: [''],
      observaciones: [''],
      comprobado: [false],
      estado: [null]
    });
  }

  agregarProducto(form: FormGroup): void {
    const productos = form.get('productos') as FormArray;
    productos.push(this.createProductoGroup());
  }

  eliminarProducto(form: FormGroup, index: number): void {
    const productos = form.get('productos') as FormArray;
    if (productos.length > 1) {
      productos.removeAt(index);
    }
  }

  getProductosArray(form: FormGroup): FormArray {
    return form.get('productos') as FormArray;
  }
}