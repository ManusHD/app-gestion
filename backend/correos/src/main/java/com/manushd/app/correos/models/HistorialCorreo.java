package com.manushd.app.correos.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistorialCorreo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String destinatario;
    private String asunto;
    
    @Column(columnDefinition = "TEXT")
    private String cuerpo;
    
    private Long salidaId;
    private String colaboradorNombre;
    
    private Boolean enviado;
    private String mensajeError;
    
    private LocalDateTime fechaEnvio;
    
    @PrePersist
    protected void onCreate() {
        fechaEnvio = LocalDateTime.now();
    }
}