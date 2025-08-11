package com.manushd.app.muebles.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Producto {
    private Long id;
    private String referencia;
    private String description;
    private String estado;
    private Integer stock;
}