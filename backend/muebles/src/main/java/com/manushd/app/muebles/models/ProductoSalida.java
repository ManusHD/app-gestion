package com.manushd.app.muebles.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ProductoSalida {
    private Long id;
    private String ref;
    private String description;
    private Integer unidades;
    private Integer unidadesPedidas;
    private String ubicacion;
    private Integer palets;
    private Integer bultos;
    private String formaEnvio;
    private String observaciones;
    private Boolean comprobado = false;
    private String estado;
}