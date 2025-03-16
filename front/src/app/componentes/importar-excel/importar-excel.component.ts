import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import { FormularioEntradaSalidaService } from 'src/app/services/formulario-entrada-salida.service';

@Component({
  selector: 'app-importar-excel',
  templateUrl: './importar-excel.component.html',
  styleUrls: ['./importar-excel.component.css'],
})
export class ImportarExcelComponent extends FormularioEntradaSalidaService{
  
  // Método para manejar la importación de archivos Excel
  onFileChange(event: any) {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
      
          const excelData = XLSX.utils.sheet_to_json(worksheet);
      
          // Convertir las claves de cada objeto a minúsculas
          const normalizedExcelData = excelData.map(row => {
            const normalizedRow: { [key: string]: any } = {};
            for (const key in row as Object) {
              normalizedRow[key.toLowerCase().trim()] = (row as any)[key];
            }
            return normalizedRow;
          });
      
          this.importarES.setExcelData(normalizedExcelData);

          console.log(normalizedExcelData);
      
          // Mostrar mensaje de éxito
          this.snackBarExito('Excel importado correctamente');
      
          event.target.value = '';
        } catch (error) {
          console.error('Error procesando Excel:', error);
          this.snackBarError('Error al procesar el archivo Excel');
        }
      };
      reader.readAsBinaryString(file);
    }
  }
}
