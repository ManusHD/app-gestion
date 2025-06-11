package com.manushd.app.productos.models;

import lombok.Data;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class CambioEstadoRequest {
    private String nombreAnterior;
    private String nombreNuevo;
}