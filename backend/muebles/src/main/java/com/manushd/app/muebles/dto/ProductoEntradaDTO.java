package com.manushd.app.muebles.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoEntradaDTO {
    private String ref;
    private String description;
    private String estado;
    private Integer unidades;
    private String ubicacion = "";
    private Integer palets = 0;
    private Integer bultos = 0;
    private String observaciones;
    private Boolean comprobado = false;
}