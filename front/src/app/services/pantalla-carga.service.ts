import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable()
export class PantallaCargaService {
    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();
  
    show() {
      console.log('Cargando...');
      this.loadingSubject.next(true);
    }
  
    hide() {
      console.log('Ya cargado');
      this.loadingSubject.next(false);
    }
}