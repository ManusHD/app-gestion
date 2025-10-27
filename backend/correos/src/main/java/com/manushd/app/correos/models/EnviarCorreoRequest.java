package com.manushd.app.correos.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnviarCorreoRequest {
    private String destinatario;
    private String asunto;
    private String cuerpo;
    private Long salidaId;
    private String colaboradorNombre;
    private List<String> imagenesUrls;
    private List<ImagenBase64> imagenesBase64; // NUEVO
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImagenBase64 {
        private String nombre;
        private String contenidoBase64;
        private String contentType;
    }
}