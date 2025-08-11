package com.manushd.app.muebles.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ProductoEntrada {
    private Long id;
    private String ref;
    private String description;
    private Integer unidades;
    private String ubicacion;
    private Integer palets;
    private Integer bultos;
    private String observaciones;
    private Boolean comprobado = false;
    private String estado;
}