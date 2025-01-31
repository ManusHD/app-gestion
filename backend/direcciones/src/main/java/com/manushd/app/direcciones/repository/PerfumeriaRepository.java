package com.manushd.app.direcciones.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.direcciones.models.Perfumeria;

@RestResource(path="perfumerias", rel="perfumeria")
public interface PerfumeriaRepository extends CrudRepository<Perfumeria, Long>{
    
        Optional<Perfumeria> findByNombre(String Nombre);

        Iterable<Perfumeria> findAllByOrderByNombreAsc();

        Iterable<Perfumeria> findByNombreContainingIgnoreCase(String nombre);

        Iterable<Perfumeria> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);
}
