import { Colaborador } from "./colaborador.model";
import { Direccion } from "./direccion.model";

export class PDV extends Direccion{
    id?: number;
    colaborador!: Colaborador;
}