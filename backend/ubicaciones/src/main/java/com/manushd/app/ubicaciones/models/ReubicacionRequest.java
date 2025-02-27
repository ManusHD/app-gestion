package com.manushd.app.ubicaciones.models;

import lombok.Data;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReubicacionRequest {
    private String origen;
    private String destino;
    private ProductoUbicacion producto;
}
