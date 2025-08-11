package com.manushd.app.muebles.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoSalidaDTO {
    private String ref;
    private String description;
    private String estado;
    private Integer unidades;
    private Integer unidadesPedidas;
    private Integer palets = 0;
    private Integer bultos = 0;
    private String formaEnvio = "";
    private String observaciones;
    private Boolean comprobado = false;
}