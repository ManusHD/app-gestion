package com.manushd.app.ubicaciones.models;

import lombok.Data;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MigrarEstadoUbicacionDTO {
    private String referencia;
    private String estadoDestino;
}
