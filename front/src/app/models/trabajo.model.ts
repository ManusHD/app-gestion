export class Trabajo {
    id?: number;
    fecha?: string;
    concepto?: string;
    perfumeria?: string;
    pdv?: string;
    otroOrigen?: string;
    direccion?: string;
    poblacion?: string;
    provincia?: string;
    cp?: string;
    telefono?: string;
    horas?: number;
    importePorHora?: number = 25;
    importeTotal?: number;
    observaciones?: string;
    estado: boolean = false; // false = previsión, true = realizado
}