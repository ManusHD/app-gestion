package com.manushd.app.salidas.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.salidas.models.Salida;

@RestResource(path="salidas", rel="salida")
public interface SalidaRepository extends CrudRepository<Salida, Long>{

        Iterable<Salida> findAllByEstado(boolean estado);
        
}
