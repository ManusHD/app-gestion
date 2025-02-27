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
    comprobado: boolean = false;
    productoId?: number;
}