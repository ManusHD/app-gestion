package com.manushd.app.productos.models;

public class EstadoStockDTO {
    private String estado;
    private Integer stock;
    
    public EstadoStockDTO() {}
    
    public EstadoStockDTO(String estado, Integer stock) {
        this.estado = estado;
        this.stock = stock;
    }
    
    // Getters y setters
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
}
