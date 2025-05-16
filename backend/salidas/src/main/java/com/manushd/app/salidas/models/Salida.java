package com.manushd.app.salidas.models;

import lombok.Data;

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
public class Salida {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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
    private Boolean estado; // false = pendiente, true = recibida
    private Boolean rellena; // false = no rellena, true = rellena
    private Date fechaEnvio;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "salidaId")
    private Set<ProductoSalida> productos;
}
