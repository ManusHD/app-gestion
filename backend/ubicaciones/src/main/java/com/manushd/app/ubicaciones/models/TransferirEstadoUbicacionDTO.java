package com.manushd.app.ubicaciones.models;

import lombok.Data;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferirEstadoUbicacionDTO {
    private String ubicacionNombre;
    private String referencia;
    private String estadoOrigen;
    private String estadoDestino;
    private Integer cantidad;
}
