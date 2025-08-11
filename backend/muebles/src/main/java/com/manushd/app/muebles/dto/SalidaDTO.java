package com.manushd.app.muebles.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalidaDTO {
    private String destino;
    private String perfumeria;
    private String pdv;
    private String direccion;
    private String poblacion;
    private String provincia;
    private String cp;
    private String telefono;
    private Boolean estado = false;
    private String fechaEnvio; // String en formato yyyy-MM-dd
    private Boolean rellena = false;
    private Set<ProductoSalidaDTO> productos;
}