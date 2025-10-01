import { ProductoMueble } from "./productoMueble.model";

export class Mueble {
    id?: number;
    fechaOrdenTrabajo?: string;
    fechaAsignacion?: string;
    fechaPrevistaRealizacion?: string;
    fechaRealizacion?: string;
    perfumeria?: string;
    pdv?: string;
    colaborador?: string;
    otroDestino?: string;
    direccion?: string;
    poblacion?: string;
    provincia?: string;
    cp?: string;
    telefono?: string;
    tipoAccion?: 'IMPLANTACION' | 'RETIRADA' | 'INTERCAMBIO';
    presupuesto?: number;
    indicaciones?: string;
    incidencias?: string;
    costeColaborador?: number;
    costeEnvio?: number;
    costeTotal?: number;
    importeFacturar?: number;
    estado: boolean = false;
    productos?: ProductoMueble[];
}