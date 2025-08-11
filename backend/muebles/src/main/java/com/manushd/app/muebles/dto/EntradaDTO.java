package com.manushd.app.muebles.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EntradaDTO {
    private String origen;
    private String perfumeria;
    private String pdv;
    private String colaborador;
    private String dcs;
    private Boolean estado = false;
    private String fechaRecepcion; // String en formato yyyy-MM-dd
    private Set<ProductoEntradaDTO> productos;
}