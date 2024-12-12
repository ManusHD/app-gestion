import { ProductoEntrada } from "./productoEntrada.model";


export class Entrada {
    id?: number;
    origen?: string;
    estado: boolean = false; // false = pendiente, true = recibida
    productos?: ProductoEntrada[];
    rellena?: boolean;
}