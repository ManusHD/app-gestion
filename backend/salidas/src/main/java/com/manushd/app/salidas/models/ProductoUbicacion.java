package com.manushd.app.salidas.models;

import lombok.Data;

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
public class ProductoUbicacion {
    @Id
    @GeneratedValue
    private Long id;
    private String ref;
    private String description;
    private Integer unidades;
}
