package com.manushd.app.salidas.models;

import lombok.Data;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoSalida {
    @Id
    @GeneratedValue
    private Long id;
    private String ref; // 7 dígitos
    private String description;
    private Integer unidades;
    private Integer unidadesPedidas;
    private String ubicacion;
    private Integer palets;
    private Integer bultos;
    private String formaEnvio;
    private String observaciones;
    private Boolean comprobado;
}
