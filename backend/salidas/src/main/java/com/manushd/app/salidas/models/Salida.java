package com.manushd.app.salidas.models;

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
public class Salida {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String destino; 
    private Date fechaEnvio;
    private String formaEnvio;
    private Boolean estado; // false = pendiente, true = recibida

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "productoId")
    private Set<ProductoSalida> productos;
}
