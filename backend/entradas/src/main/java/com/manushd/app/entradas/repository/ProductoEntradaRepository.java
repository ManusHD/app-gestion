package com.manushd.app.entradas.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.entradas.models.ProductoEntrada;

@RestResource(path="productosEntrada", rel="entrada")
public interface ProductoEntradaRepository extends CrudRepository<ProductoEntrada, Long>{
    
}
