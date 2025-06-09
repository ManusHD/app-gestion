package com.manushd.app.productos.models;

import lombok.Data;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class TransferirEstadoDTO {
    private String referencia;
    private String estadoOrigen;
    private String estadoDestino;
    private Integer cantidad;
}
