package com.manushd.app.agenciasenvio.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.agenciasenvio.models.Agencia;

@RestResource(path="agencias", rel="agencia")
public interface AgenciaRepository extends CrudRepository<Agencia, Long>{
    
    Optional<Agencia> findByNombre(String nombre);

    Iterable<Agencia> findAllByOrderByNombreAsc();

    Iterable<Agencia> findAllByActivaOrderByNombreAsc(boolean activa);

    Iterable<Agencia> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);
    
}
