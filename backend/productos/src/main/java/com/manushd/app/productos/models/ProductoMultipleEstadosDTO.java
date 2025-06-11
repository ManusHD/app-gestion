package com.manushd.app.productos.models;

import java.util.List;

public class ProductoMultipleEstadosDTO {
    private String referencia;
    private String description;
    private List<EstadoStockDTO> estados;
    
    // Getters y setters
    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public List<EstadoStockDTO> getEstados() { return estados; }
    public void setEstados(List<EstadoStockDTO> estados) { this.estados = estados; }
}
