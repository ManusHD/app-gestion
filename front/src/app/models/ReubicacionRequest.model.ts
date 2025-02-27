import { ProductoUbicacion } from "./productoUbicacion.model";

export class ReubicacionRequest {
    origen!: String;
    destino!: String;
    producto!: ProductoUbicacion;
}