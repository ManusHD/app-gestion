package com.manushd.app.correos.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnviarCorreoRequest {
    private String destinatario;
    private String asunto;
    private String cuerpo;
    private Long salidaId;
    private String colaboradorNombre;
    private List<String> imagenesUrls; // URLs de imágenes a incrustar
}