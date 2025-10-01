package com.manushd.app.direcciones.models;

import lombok.Data;

import jakarta.persistence.Entity;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Colaborador extends Direccion {
    private String nombre;
    private boolean activa;
    private String dni;
    private String telefono2;
    private String email;
}
