import { Component, Input } from '@angular/core';
import { Salida } from 'src/app/models/salida.model';

@Component({
  selector: 'app-etiqueta-envio',
  templateUrl: './etiqueta-envio.component.html',
  styleUrls: ['./etiqueta-envio.component.css']
})
export class EtiquetaEnvioComponent {
  @Input() salida!: Salida;

  obtenerNombreDestino(): string {

    return this.salida.destino || this.salida.colaborador || this.salida.perfumeria || 'Destino no especificado';
  }

  imprimirEtiqueta(): void {
    const contenidoImpresion = document.querySelector('.etiqueta')?.innerHTML;
    
    if (contenidoImpresion) {
      const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
      
      if (ventanaImpresion) {
        ventanaImpresion.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Etiqueta de Envío</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: white;
              }
              .etiqueta-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                padding: 0px;
              }
              
              .etiqueta {
                width: 100mm;
                height: 70mm;
                background: white;
                color: black;
                box-sizing: border-box;
                font-family: Arial, sans-serif;
                position: relative;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }
              
              .etiqueta-header {
                display: flex;
                text-align: center;
                /* border-bottom: 1px solid #000; */
                padding-bottom: 5px;
                align-items: center;
                justify-content: space-around;
              }
              
              .etiqueta-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: bold;
                text-transform: uppercase;
              }
              
              .etiqueta-header img{
                height: 50px;
              }
              
              .direccion-delim p{
                font-size: 10px;
                text-align: right;
              }
              
              .fecha-envio {
                font-size: 12px;
                margin-top: 5px;
                font-weight: normal;
              }
              
              .etiqueta-body {
                height: calc(100% - 80px);
                display: flex;
                flex-direction: column;
              }
              
              .destinatario {
                margin-bottom: 15px;
                text-align: left;
                margin: 5px 20px;
              }
              
              .destinatario h4 {
                margin: 0 0 5px 0;
                font-size: 12px;
                font-weight: bold;
                text-decoration: underline;
              }
              
              .nombre-destino {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 3px;
                text-transform: uppercase;
              }
              
              .direccion-completa {
                font-size: 11px;
                line-height: 1.3;
              }
              
              .direccion, .poblacion-provincia, .codigo-postal, .telefono {
                margin-bottom: 2px;
              }
              .peso-section {
                margin: 15px 0;
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .peso-label {
                font-weight: bold;
                font-size: 12px;
              }
              .peso-input {
                border-bottom: 1px solid #000;
                min-width: 80px;
                text-align: center;
                font-size: 12px;
              }
              .productos-resumen h5 {
                margin: 10px 0 5px 0;
                font-size: 11px;
                font-weight: bold;
              }
              .producto-item {
                font-size: 9px;
                margin-bottom: 2px;
              }
              .etiqueta-footer {
                position: absolute;
                bottom: 10px;
                left: 10px;
                right: 10px;
              }
              .codigo-barras-placeholder {
                text-align: center;
                font-family: monospace;
                font-size: 16px;
                letter-spacing: 2px;
                margin-bottom: 5px;
              }
              .numero-seguimiento {
                font-size: 10px;
                text-align: center;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .etiqueta { 
                  width: 100mm; 
                  height: 60mm; 
                  page-break-after: always;
                }
              }
            </style>
          </head>
          <body>
            <div class="etiqueta">
              ${contenidoImpresion}
            </div>
          </body>
          </html>
        `);
        
        ventanaImpresion.document.close();
        ventanaImpresion.focus();
        
        setTimeout(() => {
          ventanaImpresion.print();
          ventanaImpresion.close();
        }, 250);
      }
    }
  }
}
