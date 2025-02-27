package com.manushd.app.entradas.models;

import lombok.Data;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ProductoEntrada {
    @Id
    @GeneratedValue
    private Long id;
    private String ref; // 7 dígitos
    private String description;
    private Integer unidades;
    private String ubicacion;
    private Integer palets;
    private Integer bultos;
    private String observaciones;
    private Boolean comprobado;
}
