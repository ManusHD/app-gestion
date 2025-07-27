package com.manushd.app.trabajos.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;

import com.manushd.app.trabajos.models.Trabajo;

@RestResource(path = "trabajos", rel = "trabajo")
public interface TrabajoRepository extends PagingAndSortingRepository<Trabajo, Long> {

    Page<Trabajo> findAllByEstado(boolean estado, Pageable pageable);

    Iterable<Trabajo> findAllByEstadoOrderByFechaDesc(boolean estado);

    Page<Trabajo> findAllByEstadoOrderByFechaDesc(boolean estado, Pageable pageable);

    Optional<Trabajo> findById(Long id);

    Trabajo save(Trabajo trabajo);

    void deleteById(Long id);

    @Query("SELECT t FROM Trabajo t WHERE DATE(t.fecha) BETWEEN :fechaInicio AND :fechaFin AND t.estado = :estado ORDER BY t.fecha DESC")
    Page<Trabajo> findByFechaBetweenAndEstadoOrderByFechaDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("estado") boolean estado,
            Pageable pageable);

    @Query("SELECT t FROM Trabajo t WHERE DATE(t.fecha) BETWEEN :fechaInicio AND :fechaFin AND LOWER(t.concepto) LIKE LOWER(CONCAT('%', :concepto, '%')) AND t.estado = true ORDER BY t.fecha DESC")
    Page<Trabajo> findByFechaAndConceptoOrderByFechaDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("concepto") String concepto,
            Pageable pageable);

    @Query("SELECT t FROM Trabajo t WHERE " +
            "DATE(t.fecha) BETWEEN :fechaInicio AND :fechaFin AND " +
            "(:textoBusqueda IS NULL OR " +
            "LOWER(t.otroOrigen) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(t.perfumeria) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(t.pdv) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(t.direccion) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(t.poblacion) LIKE LOWER(CONCAT('%', :textoBusqueda, '%'))) " +
            "AND t.estado = true " +
            "ORDER BY t.fecha DESC")
    Page<Trabajo> findByFechaAndDireccionOrderByFechaDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("textoBusqueda") String textoBusqueda,
            Pageable pageable);

    @Query("SELECT t FROM Trabajo t WHERE DATE(t.fecha) BETWEEN :fechaInicio AND :fechaFin AND LOWER(t.observaciones) LIKE LOWER(CONCAT('%', :observacion, '%')) AND t.estado = true ORDER BY t.fecha DESC")
    Page<Trabajo> findByFechaAndObservacionOrderByFechaDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("observacion") String observacion,
            Pageable pageable);

    // Versiones sin paginación para exportar
    @Query("SELECT t FROM Trabajo t WHERE DATE(t.fecha) BETWEEN :fechaInicio AND :fechaFin AND t.estado = :estado ORDER BY t.fecha DESC")
    Iterable<Trabajo> findByFechaBetweenAndEstadoOrderByFechaDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("estado") boolean estado);

    @Query("SELECT t FROM Trabajo t WHERE DATE(t.fecha) BETWEEN :fechaInicio AND :fechaFin AND LOWER(t.concepto) LIKE LOWER(CONCAT('%', :concepto, '%')) AND t.estado = true ORDER BY t.fecha DESC")
    Iterable<Trabajo> findByFechaAndConceptoOrderByFechaDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("concepto") String concepto);

    @Query("SELECT t FROM Trabajo t WHERE " +
            "DATE(t.fecha) BETWEEN :fechaInicio AND :fechaFin AND " +
            "(:textoBusqueda IS NULL OR " +
            "LOWER(t.otroOrigen) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(t.perfumeria) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(t.pdv) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(t.direccion) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
            "LOWER(t.poblacion) LIKE LOWER(CONCAT('%', :textoBusqueda, '%'))) " +
            "AND t.estado = true " +
            "ORDER BY t.fecha DESC")
    Iterable<Trabajo> findByFechaAndDireccionOrderByFechaDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("textoBusqueda") String textoBusqueda);

    @Query("SELECT t FROM Trabajo t WHERE DATE(t.fecha) BETWEEN :fechaInicio AND :fechaFin AND LOWER(t.observaciones) LIKE LOWER(CONCAT('%', :observacion, '%')) AND t.estado = true ORDER BY t.fecha DESC")
    Iterable<Trabajo> findByFechaAndObservacionOrderByFechaDesc(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("observacion") String observacion);
}