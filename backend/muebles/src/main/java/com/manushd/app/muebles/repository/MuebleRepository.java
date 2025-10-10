package com.manushd.app.muebles.repository;

import com.manushd.app.muebles.models.Mueble;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RestResource;
import java.time.LocalDate;
import java.util.Optional;

@RestResource(path = "muebles", rel = "mueble")
public interface MuebleRepository extends PagingAndSortingRepository<Mueble, Long> {

    Page<Mueble> findAllByEstadoOrderByFechaRealizacionDesc(boolean estado, Pageable pageable);
    Iterable<Mueble> findAllByEstadoOrderByFechaRealizacionDesc(boolean estado);
    
    // Encontrar todos los muebles con estado=false (pendientes) ordenador por fecha de orden de trabajo descendente
    Page<Mueble> findAllByEstadoFalseOrderByFechaOrdenTrabajoDesc(Pageable pageable);

    Optional<Mueble> findById(Long id);
    Mueble save(Mueble mueble);
    void deleteById(Long id);

    @Query("SELECT m FROM Mueble m WHERE DATE(m.fechaRealizacion) BETWEEN :fechaInicio AND :fechaFin AND m.estado = :estado ORDER BY m.fechaRealizacion DESC")
    Page<Mueble> findByFechaRealizacionBetweenAndEstadoOrderByFechaRealizacionDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("estado") boolean estado,
            Pageable pageable);

    @Query("SELECT DISTINCT m FROM Mueble m JOIN m.productos p WHERE DATE(m.fechaRealizacion) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.ref) LIKE LOWER(CONCAT('%', :referencia, '%')) AND m.estado = true ORDER BY m.fechaRealizacion DESC")
    Page<Mueble> findByFechaAndReferenciaOrderByFechaRealizacionDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("referencia") String referencia,
            Pageable pageable);

    @Query("SELECT DISTINCT m FROM Mueble m JOIN m.productos p WHERE DATE(m.fechaRealizacion) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.description) LIKE LOWER(CONCAT('%', :descripcion, '%')) AND m.estado = true ORDER BY m.fechaRealizacion DESC")
    Page<Mueble> findByFechaAndDescripcionOrderByFechaRealizacionDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("descripcion") String descripcion,
            Pageable pageable);

    @Query("SELECT m FROM Mueble m WHERE " +
            "DATE(m.fechaRealizacion) BETWEEN :fechaInicio AND :fechaFin AND " +
            "(:textoBusqueda IS NULL OR " +
            "LOWER(m.perfumeria) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(m.pdv) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(m.colaborador) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(m.otroDestino) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(m.direccion) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(m.poblacion) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(m.provincia) LIKE LOWER(CONCAT('%', :textoBusqueda, '%'))) " +
            "AND m.estado = true " +
            "ORDER BY m.fechaRealizacion DESC")
    Page<Mueble> findByFechaAndDestinoOrderByFechaRealizacionDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("textoBusqueda") String textoBusqueda,
            Pageable pageable);

    // Métodos sin paginación para exportar
    @Query("SELECT m FROM Mueble m WHERE DATE(m.fechaRealizacion) BETWEEN :fechaInicio AND :fechaFin AND m.estado = :estado ORDER BY m.fechaRealizacion DESC")
    Iterable<Mueble> findByFechaRealizacionBetweenAndEstadoOrderByFechaRealizacionDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("estado") boolean estado);

    @Query("SELECT DISTINCT m FROM Mueble m JOIN m.productos p WHERE DATE(m.fechaRealizacion) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.ref) LIKE LOWER(CONCAT('%', :referencia, '%')) AND m.estado = true ORDER BY m.fechaRealizacion DESC")
    Iterable<Mueble> findByFechaAndReferenciaOrderByFechaRealizacionDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("referencia") String referencia);

    @Query("SELECT DISTINCT m FROM Mueble m JOIN m.productos p WHERE DATE(m.fechaRealizacion) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.description) LIKE LOWER(CONCAT('%', :descripcion, '%')) AND m.estado = true ORDER BY m.fechaRealizacion DESC")
    Iterable<Mueble> findByFechaAndDescripcionOrderByFechaRealizacionDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("descripcion") String descripcion);

    @Query("SELECT m FROM Mueble m WHERE " +
            "DATE(m.fechaRealizacion) BETWEEN :fechaInicio AND :fechaFin AND " +
            "(:textoBusqueda IS NULL OR " +
            "LOWER(m.perfumeria) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(m.pdv) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(m.colaborador) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(m.otroDestino) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(m.direccion) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(m.poblacion) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(m.provincia) LIKE LOWER(CONCAT('%', :textoBusqueda, '%'))) " +
            "AND m.estado = true " +
            "ORDER BY m.fechaRealizacion DESC")
    Iterable<Mueble> findByFechaAndDestinoOrderByFechaRealizacionDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("textoBusqueda") String textoBusqueda);
}