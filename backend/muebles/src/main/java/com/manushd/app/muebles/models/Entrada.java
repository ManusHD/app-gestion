package com.manushd.app.muebles.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Entrada {
    private Long id;
    private String origen;
    private LocalDate fechaRecepcion;
    private String perfumeria;
    private String pdv;
    private String colaborador;
    private String dcs;
    private Boolean estado = false;
    private Set<ProductoEntrada> productos;
}