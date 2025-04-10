// producto-transfer.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SalidaUbicacionService {
  private productosSource = new BehaviorSubject<any[]>([]);
  productos$ = this.productosSource.asObservable();

  enviarProductos(productos: any[]) {
    this.productosSource.next(productos);
  }

  resetProductos() {
    this.productosSource.next([]);
  }
}
