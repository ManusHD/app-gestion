package com.manushd.app.ubicaciones.models;

import lombok.Data;

import java.util.Set;

import com.manushd.app.ubicaciones.models.ProductoUbicacion;

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
public class Ubicacion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nombre;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "ubicacion_id")
    private Set<ProductoUbicacion> productos;
}
