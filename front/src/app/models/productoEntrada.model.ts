export class ProductoEntrada {
    id?: number;
    ref?: String;
    description?: String;
    unidades?: number;
    ubicacion?: String;
    palets?: number;
    bultos?: number;
    observaciones?: String;
    pendiente: boolean = false; // false = recibida, true = pendiente
    idPadre?: number;
}