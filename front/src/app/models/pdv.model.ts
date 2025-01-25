import { Perfumeria } from "./perfumeria.model";

export class PDV {
    id?: number;
    nombre?: string;
    direccion?: string;
    poblacion?: string;
    provincia?: string;
    cp?: string;
    telefono?: string;
    pdvs: Perfumeria[] = [];
}