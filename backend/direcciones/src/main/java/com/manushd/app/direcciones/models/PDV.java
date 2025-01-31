package com.manushd.app.direcciones.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.io.Serializable;
import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.CascadeType;



@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class PDV extends Direccion {
    private String nombre;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "pdvId")
    private Set<Perfumeria> perfumerias;
}
