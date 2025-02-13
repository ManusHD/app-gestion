import { PDV } from "./pdv.model";

export class Perfumeria {
    id?: number;
    nombre?: string;
    activa?: boolean;
    pdvs: PDV[] = [];
}