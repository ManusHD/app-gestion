package com.manushd.app.ubicaciones.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.ubicaciones.models.Ubicacion;

@RestResource(path="ubicaciones", rel="ubicacion")
public interface UbicacionesRepository extends CrudRepository<Ubicacion, Long>{

        Iterable<Ubicacion> findAllByOrderByNombreAsc();

        Optional<Ubicacion> findByNombre(String nombre);

        Iterable<Ubicacion> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

        Iterable<Ubicacion> findByProductosRefOrderByNombreAsc(String ref);

        Iterable<Ubicacion> findByProductosDescriptionOrderByNombreAsc(String ref);

}
