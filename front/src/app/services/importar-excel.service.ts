import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ImportarExcelService {
  private excelDataSource = new BehaviorSubject<any[]>([]);
  excelData$ = this.excelDataSource.asObservable();
  
  private entradaSource = new BehaviorSubject<any | null>(null);
  entrada$ = this.entradaSource.asObservable();

  setExcelData(data: any[]) {
    this.excelDataSource.next(data);
  }

  setEntrada(entrada: any) {
    this.entradaSource.next(entrada);
  }

  getEntrada() {
    return this.entrada$;
  }

  resetExcel() {
    this.excelDataSource.next([]);
  }
}
