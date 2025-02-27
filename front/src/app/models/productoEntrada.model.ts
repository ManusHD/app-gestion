export class ProductoEntrada {
    id?: number;
    ref?: String;
    description?: String;
    unidades?: number;
    ubicacion?: String;
    palets?: number;
    bultos?: number;
    observaciones?: String;
    comprobado: boolean = true;
}