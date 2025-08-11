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
public class Salida {
    private Long id;
    private String destino;
    private String perfumeria;
    private String pdv;
    private String colaborador;
    private String direccion;
    private String poblacion;
    private String provincia;
    private String cp;
    private String telefono;
    private Boolean estado = false;
    private Set<ProductoSalida> productos;
    private LocalDate fechaEnvio;
    private Boolean rellena;
}