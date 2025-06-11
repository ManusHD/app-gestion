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
        Page<Ubicacion> findByProductosDescriptionContainingIgnoreCaseOrderByNombreAsc(
                        @Param("description") String description, Pageable pageable);

        Iterable<Ubicacion> findByProductosDescriptionContainingIgnoreCaseOrderByNombreAsc(String description);

        Optional<Ubicacion> findById(Long id);

        Iterable<Ubicacion> findAll();

        Ubicacion save(Ubicacion ubicacion);

        void deleteById(Long id);

        // NUEVOS métodos para búsqueda por referencia y estado
        @Query("SELECT u FROM Ubicacion u JOIN u.productos p WHERE p.ref = :referencia AND p.estado = :estado")
        Page<Ubicacion> findByProductosRefAndEstado(@Param("referencia") String referencia,
                        @Param("estado") String estado,
                        Pageable pageable);

        @Query("SELECT u FROM Ubicacion u JOIN u.productos p WHERE p.ref = :referencia AND p.estado = :estado")
        Iterable<Ubicacion> findByProductosRefAndEstado(@Param("referencia") String referencia,
                        @Param("estado") String estado);

        // NUEVO método para búsqueda por estado
        @Query("SELECT u FROM Ubicacion u JOIN u.productos p WHERE p.estado = :estado")
        Page<Ubicacion> findByProductosEstado(@Param("estado") String estado, Pageable pageable);

        @Query("SELECT u FROM Ubicacion u JOIN u.productos p WHERE p.estado = :estado")
        Iterable<Ubicacion> findByProductosEstado(@Param("estado") String estado);

        @Query("SELECT DISTINCT u FROM Ubicacion u JOIN u.productos p WHERE LOWER(p.description) LIKE LOWER(CONCAT('%', :description, '%')) AND p.estado = :estado ORDER BY u.nombre")
        Page<Ubicacion> findByProductosDescriptionContainingIgnoreCaseAndEstado(
                @Param("description") String description, 
                @Param("estado") String estado, 
                Pageable pageable);

        @Query("SELECT DISTINCT u FROM Ubicacion u JOIN u.productos p WHERE LOWER(p.description) LIKE LOWER(CONCAT('%', :description, '%')) AND p.estado = :estado ORDER BY u.nombre")
        Iterable<Ubicacion> findByProductosDescriptionContainingIgnoreCaseAndEstado(
                @Param("description") String description, 
                @Param("estado") String estado);

        // Búsqueda por referencia y estado (ya existe pero verificar)
        @Query("SELECT DISTINCT u FROM Ubicacion u JOIN u.productos p WHERE LOWER(p.ref) LIKE LOWER(CONCAT('%', :ref, '%')) AND p.estado = :estado ORDER BY u.nombre")
        Page<Ubicacion> findByProductosRefContainingIgnoreCaseAndEstado(
                @Param("ref") String ref, 
                @Param("estado") String estado, 
                Pageable pageable);

        @Query("SELECT DISTINCT u FROM Ubicacion u JOIN u.productos p WHERE LOWER(p.ref) LIKE LOWER(CONCAT('%', :ref, '%')) AND p.estado = :estado ORDER BY u.nombre")
        Iterable<Ubicacion> findByProductosRefContainingIgnoreCaseAndEstado(
                @Param("ref") String ref, 
                @Param("estado") String estado);
}
