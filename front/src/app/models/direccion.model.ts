export abstract class Direccion {
    nombre?: string;
    telefono?: string;
    direccion?: string;
    poblacion?: string;
    provincia?: string;
    cp?: string;

    distancia?: number = 0;
    tarifaExtra?: number = 0;
}
