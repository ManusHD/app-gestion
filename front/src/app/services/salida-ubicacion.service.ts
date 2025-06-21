import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Ubicacion } from '../models/ubicacion.model';

@Injectable({ providedIn: 'root' })
export class SalidaUbicacionService {
  private productosSource = new BehaviorSubject<any[]>([]);
  productos$ = this.productosSource.asObservable();

  // NUEVO: Para manejar múltiples ubicaciones
  private ubicacionesSeleccionadasSource = new BehaviorSubject<Ubicacion[]>([]);
  ubicacionesSeleccionadas$ = this.ubicacionesSeleccionadasSource.asObservable();

  enviarProductos(productos: any[]) {
    this.productosSource.next(productos);
  }

  // NUEVO: Agregar ubicación a la selección
  agregarUbicacionASeleccion(ubicacion: Ubicacion) {
    const ubicacionesActuales = this.ubicacionesSeleccionadasSource.value;
    
    // Verificar que no esté ya seleccionada
    const yaSeleccionada = ubicacionesActuales.some(u => u.id === ubicacion.id);
    if (!yaSeleccionada) {
      const nuevasUbicaciones = [...ubicacionesActuales, ubicacion];
      this.ubicacionesSeleccionadasSource.next(nuevasUbicaciones);
      
      // Agregar productos de esta ubicación a la lista total
      const productosActuales = this.productosSource.value;
      const nuevosProductos = [...productosActuales, ...(ubicacion.productos || [])];
      this.productosSource.next(nuevosProductos);
    }
  }

  // NUEVO: Quitar ubicación de la selección
  quitarUbicacionDeSeleccion(ubicacionId: number) {
    const ubicacionesActuales = this.ubicacionesSeleccionadasSource.value;
    const ubicacionAQuitar = ubicacionesActuales.find(u => u.id === ubicacionId);
    
    if (ubicacionAQuitar) {
      // Remover ubicación
      const nuevasUbicaciones = ubicacionesActuales.filter(u => u.id !== ubicacionId);
      this.ubicacionesSeleccionadasSource.next(nuevasUbicaciones);
      
      // Remover productos de esta ubicación
      const productosActuales = this.productosSource.value;
      const productosAQuitar = ubicacionAQuitar.productos || [];
      const nuevosProductos = productosActuales.filter(p => 
        !productosAQuitar.some(pq => pq.id === p.id)
      );
      this.productosSource.next(nuevosProductos);
    }
  }

  // NUEVO: Verificar si una ubicación está seleccionada
  estaUbicacionSeleccionada(ubicacionId: number): boolean {
    return this.ubicacionesSeleccionadasSource.value.some(u => u.id === ubicacionId);
  }

  // NUEVO: Obtener ubicaciones seleccionadas
  getUbicacionesSeleccionadas(): Ubicacion[] {
    return this.ubicacionesSeleccionadasSource.value;
  }

  // NUEVO: Limpiar todas las selecciones
  limpiarSelecciones() {
    this.ubicacionesSeleccionadasSource.next([]);
    this.productosSource.next([]);
  }

  resetProductos() {
    this.productosSource.next([]);
  }

  // NUEVO: Reset completo
  resetTodo() {
    this.productosSource.next([]);
    this.ubicacionesSeleccionadasSource.next([]);
  }
}