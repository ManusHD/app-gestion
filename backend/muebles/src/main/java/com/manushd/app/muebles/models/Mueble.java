package com.manushd.app.muebles.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Mueble {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private LocalDate fechaOrdenTrabajo;
    private LocalDate fechaAsignacion;
    private LocalDate fechaRealizacion;
    private String perfumeria;
    private String pdv;
    private String otroDestino;
    private String direccion;
    private String poblacion;
    private String provincia;
    private String cp;
    private String telefono;
    
    @Enumerated(EnumType.STRING)
    private TipoAccion tipoAccion;
    
    private String indicaciones;
    private BigDecimal costeColaborador;
    private BigDecimal costeEnvio;
    private BigDecimal costeTotal;
    private BigDecimal importeFacturar;
    private Boolean estado = false; // false = pendiente, true = realizado
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "muebleId")
    private Set<ProductoMueble> productos;
    
    public enum TipoAccion {
        IMPLANTACION, RETIRADA
    }
}