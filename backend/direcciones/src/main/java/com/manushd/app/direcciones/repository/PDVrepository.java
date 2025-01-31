package com.manushd.app.direcciones.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.direcciones.models.PDV;

@RestResource(path="pdvs", rel="pdv")
public interface PDVrepository extends CrudRepository<PDV, Long>{
    
        Optional<PDV> findByNombre(String Nombre);

        Iterable<PDV> findAllByOrderByNombreAsc();

        Iterable<PDV> findByNombreContainingIgnoreCase(String nombre);

        Iterable<PDV> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

        Iterable<PDV> findByPerfumeriasNombreOrderByNombreAsc(String nombre);
}
