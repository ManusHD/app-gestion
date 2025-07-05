package com.manushd.app.direcciones.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToOne;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Inheritance(strategy = InheritanceType.JOINED)
public class PDV extends Direccion {
    private String nombre;
    
    @ManyToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(name = "pdv_colaborador",
        joinColumns = @JoinColumn(name = "pdv_id"),
        inverseJoinColumns = @JoinColumn(name = "colaborador_id"))
    private Colaborador colaborador;
}
