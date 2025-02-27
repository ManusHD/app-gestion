package com.manushd.app.ubicaciones.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.ubicaciones.models.Ubicacion;

@RestResource(path = "ubicaciones", rel = "ubicacion")
public interface UbicacionesRepository extends PagingAndSortingRepository<Ubicacion, Long> {

        Page<Ubicacion> findAllByOrderByNombreAsc(Pageable pageable);
        Iterable<Ubicacion> findAllByOrderByNombreAsc();

        Optional<Ubicacion> findByNombre(String nombre);

        Page<Ubicacion> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre, Pageable pageable);
        Iterable<Ubicacion> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

        Page<Ubicacion> findByProductosRefOrderByNombreAsc(String ref, Pageable pageable);
        Iterable<Ubicacion> findByProductosRefOrderByNombreAsc(String ref);

        Page<Ubicacion> findByProductosDescriptionOrderByNombreAsc(String description, Pageable pageable);
        Iterable<Ubicacion> findByProductosDescriptionOrderByNombreAsc(String description);

        Optional<Ubicacion> findById(Long id);

        Ubicacion save(Ubicacion ubicacion);

        void deleteById(Long id);
}
