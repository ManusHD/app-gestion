package com.manushd.app.ubicaciones.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
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
        
        @Query("SELECT DISTINCT u FROM Ubicacion u JOIN u.productos p WHERE LOWER(p.ref) LIKE LOWER(CONCAT('%', :ref, '%')) ORDER BY u.nombre")
        Page<Ubicacion> findByProductosRefContainingIgnoreCaseOrderByNombreAsc(String ref, Pageable pageable);
        Iterable<Ubicacion> findByProductosRefContainingIgnoreCaseOrderByNombreAsc(String ref);

        @Query("SELECT DISTINCT u FROM Ubicacion u JOIN u.productos p WHERE LOWER(p.description) LIKE LOWER(CONCAT('%', :description, '%')) ORDER BY u.nombre")
        Page<Ubicacion> findByProductosDescriptionContainingIgnoreCaseOrderByNombreAsc(@Param("description") String description, Pageable pageable);
        Iterable<Ubicacion> findByProductosDescriptionContainingIgnoreCaseOrderByNombreAsc(String description);

        Optional<Ubicacion> findById(Long id);

        Ubicacion save(Ubicacion ubicacion);

        void deleteById(Long id);
}
