import { Producto } from './producto.model';

export interface ProductoAgrupado {
  referencia: string;
  description: string;
  productos: Producto[];
  totalStock: number;
  expanded: boolean;
}
