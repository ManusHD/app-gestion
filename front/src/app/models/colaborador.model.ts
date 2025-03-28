import { Direccion } from "./direccion.model";

export class Colaborador extends Direccion{
    id?: number;
    dni?: string;
    telefono2?: string;
    activa?: boolean;
}