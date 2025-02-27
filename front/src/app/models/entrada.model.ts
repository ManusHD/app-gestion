import { ProductoEntrada } from "./productoEntrada.model";


export class Entrada {
    id?: number;
    origen?: string;
    perfumeria?: string;
    pdv?: string;
    colaborador?: string;
    dcs?: String;
    estado: boolean = false; // false = pendiente, true = recibida
    productos!: ProductoEntrada[];
    rellena: boolean = false;
    fechaRecepcion?: string;
}