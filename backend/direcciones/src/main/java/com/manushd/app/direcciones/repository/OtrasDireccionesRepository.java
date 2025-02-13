package com.manushd.app.direcciones.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.direcciones.models.OtrasDirecciones;

@RestResource(path="otrasDirecciones", rel="otraDireccion")
public interface OtrasDireccionesRepository extends CrudRepository<OtrasDirecciones, Long> {
    
    Optional<OtrasDirecciones> findByNombre(String Nombre);

    Iterable<OtrasDirecciones> findAllByOrderByNombreAsc();

    Iterable<OtrasDirecciones> findByNombreContainingIgnoreCase(String nombre);

    Iterable<OtrasDirecciones> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);
}
