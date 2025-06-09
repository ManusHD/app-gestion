export class ProductoSalida {
    id?: number;
    ref?: string;
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
    estado?: String;
}