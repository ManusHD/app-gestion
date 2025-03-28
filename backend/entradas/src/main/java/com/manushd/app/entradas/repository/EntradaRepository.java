package com.manushd.app.entradas.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;

import com.manushd.app.entradas.models.Entrada;


@RestResource(path = "entradas", rel = "entrada")
public interface EntradaRepository extends PagingAndSortingRepository<Entrada, Long> {

        Page<Entrada> findAllByEstado(boolean estado, Pageable pageable);
        Iterable<Entrada> findAllByEstadoOrderByFechaRecepcionDesc(boolean estado);
    
        Page<Entrada> findAllByEstadoOrderByFechaRecepcionDesc(boolean estado, Pageable pageable);

        Optional<Entrada> findById(Long id);

        Entrada save(Entrada entrada);

        void deleteById(Long id);

        @Query("SELECT SUM(p.palets) FROM Entrada e JOIN e.productos p WHERE e.estado = true")
        Integer sumPaletsByEstadoTrue();
    
        @Query("SELECT e FROM Entrada e WHERE DATE(e.fechaRecepcion) BETWEEN :fechaInicio AND :fechaFin AND e.estado = :estado ORDER BY e.fechaRecepcion DESC")
        Page<Entrada> findByFechaRecepcionBetweenAndEstadoOrderByFechaRecepcionDesc(
                @Param("fechaInicio") LocalDate fechaInicio,
                @Param("fechaFin") LocalDate fechaFin,
                @Param("estado") boolean estado,
                Pageable pageable);
    
        @Query("SELECT DISTINCT e FROM Entrada e JOIN e.productos p WHERE DATE(e.fechaRecepcion) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.ref) LIKE LOWER(CONCAT('%', :referencia, '%')) AND e.estado = true ORDER BY e.fechaRecepcion DESC")
        Page<Entrada> findByFechaAndReferenciaOrderByFechaRecepcionDesc(
                @Param("fechaInicio") LocalDate fechaInicio,
                @Param("fechaFin") LocalDate fechaFin,
                @Param("referencia") String referencia,
                Pageable pageable);
    
        @Query("SELECT DISTINCT e FROM Entrada e JOIN e.productos p WHERE DATE(e.fechaRecepcion) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.description) LIKE LOWER(CONCAT('%', :descripcion, '%')) AND e.estado = true ORDER BY e.fechaRecepcion DESC")
        Page<Entrada> findByFechaAndDescripcionOrderByFechaRecepcionDesc(
                @Param("fechaInicio") LocalDate fechaInicio,
                @Param("fechaFin") LocalDate fechaFin,
                @Param("descripcion") String descripcion,
                Pageable pageable);
    
        @Query("SELECT DISTINCT e FROM Entrada e JOIN e.productos p WHERE DATE(e.fechaRecepcion) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.observaciones) LIKE LOWER(CONCAT('%', :observacion, '%')) AND e.estado = true ORDER BY e.fechaRecepcion DESC")
        Page<Entrada> findByFechaAndObservacionOrderByFechaRecepcionDesc(
                @Param("fechaInicio") LocalDate fechaInicio,
                @Param("fechaFin") LocalDate fechaFin,
                @Param("observacion") String observacion,
                Pageable pageable);
    
        @Query("SELECT e FROM Entrada e WHERE " +
                "DATE(e.fechaRecepcion) BETWEEN :fechaInicio AND :fechaFin AND " +
                "(:textoBusqueda IS NULL OR " +
                "LOWER(e.origen) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                "LOWER(e.colaborador) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                "LOWER(e.pdv) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                "LOWER(e.perfumeria) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                "LOWER(e.dcs) LIKE LOWER(CONCAT('%', :textoBusqueda, '%'))) " +
                "AND e.estado = true " +
                "ORDER BY e.fechaRecepcion DESC")
        Page<Entrada> findByFechaAndOrigenOrderByFechaRecepcionDesc(
                @Param("fechaInicio") LocalDate fechaInicio,
                @Param("fechaFin") LocalDate fechaFin,
                @Param("textoBusqueda") String textoBusqueda,
                Pageable pageable);
    
        @Query("SELECT e FROM Entrada e WHERE DATE(e.fechaRecepcion) BETWEEN :fechaInicio AND :fechaFin AND e.estado = :estado ORDER BY e.fechaRecepcion DESC")
        Iterable<Entrada> findByFechaRecepcionBetweenAndEstadoOrderByFechaRecepcionDesc(
                @Param("fechaInicio") LocalDate fechaInicio,
                @Param("fechaFin") LocalDate fechaFin,
                @Param("estado") boolean estado);
    
        @Query("SELECT DISTINCT e FROM Entrada e JOIN e.productos p WHERE DATE(e.fechaRecepcion) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.ref) LIKE LOWER(CONCAT('%', :referencia, '%')) AND e.estado = true ORDER BY e.fechaRecepcion DESC")
        Iterable<Entrada> findByFechaAndReferenciaOrderByFechaRecepcionDesc(
                @Param("fechaInicio") LocalDate fechaInicio,
                @Param("fechaFin") LocalDate fechaFin,
                @Param("referencia") String referencia);
    
        @Query("SELECT DISTINCT e FROM Entrada e JOIN e.productos p WHERE DATE(e.fechaRecepcion) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.description) LIKE LOWER(CONCAT('%', :descripcion, '%')) AND e.estado = true ORDER BY e.fechaRecepcion DESC")
        Iterable<Entrada> findByFechaAndDescripcionOrderByFechaRecepcionDesc(
                @Param("fechaInicio") LocalDate fechaInicio,
                @Param("fechaFin") LocalDate fechaFin,
                @Param("descripcion") String descripcion);
    
        @Query("SELECT DISTINCT e FROM Entrada e JOIN e.productos p WHERE DATE(e.fechaRecepcion) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.observaciones) LIKE LOWER(CONCAT('%', :observacion, '%')) AND e.estado = true ORDER BY e.fechaRecepcion DESC")
        Iterable<Entrada> findByFechaAndObservacionOrderByFechaRecepcionDesc(
                @Param("fechaInicio") LocalDate fechaInicio,
                @Param("fechaFin") LocalDate fechaFin,
                @Param("observacion") String observacion);
    
        @Query("SELECT e FROM Entrada e WHERE " +
                "DATE(e.fechaRecepcion) BETWEEN :fechaInicio AND :fechaFin AND " +
                "(:textoBusqueda IS NULL OR " +
                "LOWER(e.origen) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                "LOWER(e.colaborador) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                "LOWER(e.pdv) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                "LOWER(e.perfumeria) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                "LOWER(e.dcs) LIKE LOWER(CONCAT('%', :textoBusqueda, '%'))) " +
                "AND e.estado = true " +
                "ORDER BY e.fechaRecepcion DESC")
                Iterable<Entrada> findByFechaAndOrigenOrderByFechaRecepcionDesc(
                @Param("fechaInicio") LocalDate fechaInicio,
                @Param("fechaFin") LocalDate fechaFin,
                @Param("textoBusqueda") String textoBusqueda);
    }