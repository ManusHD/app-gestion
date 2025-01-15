package com.manushd.app.entradas.models;

import lombok.Data;

import java.util.Date;

import com.manushd.app.entradas.models.Entrada;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.CascadeType;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoEntrada {
    @Id
    @GeneratedValue
    private Long id;
    private String dcs; // 10 dígitos
    private String ref; // 7 dígitos
    private String description;
    private Integer unidades;
    private Date fechaRecepcion;
    private String ubicacion;
    private Integer palets;
    private Integer bultos;
    private String observaciones;
    private Boolean pendiente; // false = recibida, true = pendiente
    private Long idPadre;
}
