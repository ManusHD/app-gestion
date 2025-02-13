export class ProductoSalida {
    id?: number;
    ref?: String;
    description?: String;
    unidades?: number;
    unidadesPedidas?: number;
    ubicacion?: String;
    palets?: number;
    bultos?: number;
    formaEnvio?: String;
    observaciones?: String;
    pendiente: boolean = false; // false = recibida, true = pendiente
    idPadre?: number;
    productoId?: number;
}