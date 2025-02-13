package com.manushd.app.direcciones.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.io.Serializable;

import jakarta.persistence.Entity;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class PDV extends Direccion {
    private String nombre;
}
