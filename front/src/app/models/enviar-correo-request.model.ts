export class EnviarCorreoRequest {
    destinatario!: string;
    asunto!: string;
    cuerpo!: string;
    salidaId?: number;
    colaboradorNombre?: string;
    imagenesUrls?: string[];
}