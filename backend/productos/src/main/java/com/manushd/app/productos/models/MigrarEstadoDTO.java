package com.manushd.app.productos.models;

public class MigrarEstadoDTO {
    private String referencia;
    private String estadoDestino;
    
    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
    
    public String getEstadoDestino() { return estadoDestino; }
    public void setEstadoDestino(String estadoDestino) { this.estadoDestino = estadoDestino; }
}