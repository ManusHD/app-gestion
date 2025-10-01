import { Direccion } from "./direccion.model";

export class Colaborador extends Direccion{
    id?: number;
    activa?: boolean;
    dni?: string;
    telefono2?: string;
    email?: string;
}