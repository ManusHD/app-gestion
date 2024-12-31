package com.manushd.app.salidas.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.salidas.models.ProductoSalida;

@RestResource(path="productosSalida", rel="salida")
public interface ProductoSalidaRepository extends CrudRepository<ProductoSalida, Long>{
    
}
