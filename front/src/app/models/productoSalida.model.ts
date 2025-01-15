export class ProductoSalida {
    id?: number;
    dcs?: String;
    ref?: String;
    description?: String;
    unidades?: number;
    fechaEnvio?: string;
    ubicacion?: String;
    palets?: number;
    bultos?: number;
    observaciones?: String;
    pendiente: boolean = false; // false = recibida, true = pendiente
    idPadre?: number;
}