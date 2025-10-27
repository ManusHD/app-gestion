export class EnviarCorreoRequest {
    destinatario!: string;
    asunto!: string;
    cuerpo!: string;
    salidaId?: number;
    colaboradorNombre?: string;
    imagenesUrls?: string[];
    imagenesBase64?: ImagenBase64[];
}

export interface ImagenBase64 {
    nombre: string;
    contenidoBase64: string;
    contentType: string;
}