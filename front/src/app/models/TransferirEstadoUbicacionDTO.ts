export interface TransferirEstadoUbicacionDTO {
  ubicacionNombre: string;
  referencia: string;
  estadoOrigen: string | null;
  estadoDestino: string | null;
  cantidad: number;
}
