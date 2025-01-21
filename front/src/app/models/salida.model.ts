import { ProductoSalida } from "./productoSalida.model";

export class Salida {
  id?: number;
  destino?: string;
  estado: boolean = false; // false = pendiente, true = recibida
  productos!: ProductoSalida[];
  fechaEnvio?: string;
  rellena?: boolean;
}
