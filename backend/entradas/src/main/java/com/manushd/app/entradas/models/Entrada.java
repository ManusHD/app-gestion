package com.manushd.app.entradas.models;

import lombok.Data;

import java.util.List;
import java.util.Set;
import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;
import jakarta.persistence.OneToMany;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.CascadeType;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Entrada {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String origen; 
    private Date fechaRecepcion;
    private String perfumeria; 
    private String pdv; 
    private String colaborador;
    private String dcs; // 10 dígitos
    private Boolean estado; // false = pendiente, true = recibida

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "entradaId")
    private Set<ProductoEntrada> productos;
}