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

import com.manushd.app.salidas.models.ProductoDcs;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class DCS {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String dcs;

    // false = aún no se ha usado en ninguna Salida
    // true = se ha usado en alguna Salida
    private boolean usado; 
    
    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "productoId")
    private Set<ProductoDcs> productos;
}
