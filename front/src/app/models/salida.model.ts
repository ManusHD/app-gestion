import { ProductoSalida } from "./productoSalida.model";

export class Salida {
  id?: number;
  destino?: string;
  perfumeria?: string;
  pdv?: string;
  colaborador?: string;
  direccion?: string;
  poblacion?: string;
  provincia?: string;
  cp?: string;
  telefono?: string;
  estado: boolean = false; // false = pendiente, true = recibida
  productos!: ProductoSalida[];
  fechaEnvio?: string;
  rellena?: boolean;
}
