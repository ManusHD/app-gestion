package com.manushd.app.direcciones.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.direcciones.models.Colaborador;

@RestResource(path="colaboradores", rel="colaborador")
public interface ColaboradoresRepository extends CrudRepository<Colaborador, Long>{
    
        Optional<Colaborador> findByNombre(String Nombre);

        Iterable<Colaborador> findAllByOrderByNombreAsc();

        Iterable<Colaborador> findByNombreContainingIgnoreCase(String nombre);

        Iterable<Colaborador> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

}
