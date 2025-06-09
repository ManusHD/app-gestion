export interface TransferirEstadoDTO {
  referencia: string;
  estadoOrigen: string | null;
  estadoDestino: string | null;
  cantidad: number;
}