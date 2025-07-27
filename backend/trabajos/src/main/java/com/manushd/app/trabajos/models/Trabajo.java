package com.manushd.app.trabajos.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Trabajo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private LocalDate fecha;
    private String concepto;
    private String perfumeria;
    private String pdv;
    private String otroOrigen;
    private String direccion;
    private String poblacion;
    private String provincia;
    private String cp;
    private String telefono;
    private BigDecimal horas;
    private BigDecimal importePorHora = BigDecimal.valueOf(25.0);
    private BigDecimal importeTotal;
    private String observaciones;
    private Boolean estado = false; // false = previsión, true = realizado
    
    @PrePersist
    @PreUpdate
    private void calcularImporteTotal() {
        if (horas != null && importePorHora != null) {
            importeTotal = horas.multiply(importePorHora);
        }
    }
}