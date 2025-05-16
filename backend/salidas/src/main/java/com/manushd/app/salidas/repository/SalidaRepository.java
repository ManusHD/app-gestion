package com.manushd.app.salidas.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.salidas.models.Salida;

@RestResource(path = "salidas", rel = "salida")
public interface SalidaRepository extends PagingAndSortingRepository<Salida, Long> {

        Page<Salida> findAllByEstado(boolean estado, Pageable pageable);
        
        @Query("SELECT s FROM Salida s LEFT JOIN FETCH s.productos WHERE s.estado = false")
        List<Salida> findAllByEstado(@Param("estado") Boolean estado);


        Page<Salida> findAllByEstadoOrderByFechaEnvioDesc(boolean estado, Pageable pageable);
        Iterable<Salida> findAllByEstadoOrderByFechaEnvioDesc(boolean estado);

        Page<Salida> findAllByEstadoAndRellenaOrderByDireccionAsc(boolean estado, Boolean rellena, Pageable pageable);
        Iterable<Salida> findAllByEstadoAndRellenaOrderByDireccionAsc(boolean estado, Boolean rellena);

        Optional<Salida> findById(Long id);

        Salida save(Salida salida);

        void deleteById(Long id);

        @Query("SELECT SUM(p.palets) FROM Salida e JOIN e.productos p WHERE e.estado = true")
        Integer sumPaletsByEstadoTrue();

        // Buscar salidas solo por rango de fechas
        @Query("SELECT e FROM Salida e WHERE DATE(e.fechaEnvio) BETWEEN :fechaInicio AND :fechaFin AND e.estado = :estado ORDER BY e.fechaEnvio DESC")
        Page<Salida> findByFechaEnvioBetweenAndEstadoOrderByFechaEnvioDesc(
                        @Param("fechaInicio") LocalDate fechaInicio,
                        @Param("fechaFin") LocalDate fechaFin,
                        @Param("estado") boolean estado,
                        Pageable pageable);

        // Buscar por referencia dentro de un rango de fechas
        @Query("SELECT DISTINCT e FROM Salida e JOIN e.productos p WHERE DATE(e.fechaEnvio) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.ref) LIKE LOWER(CONCAT('%', :referencia, '%')) AND e.estado = true ORDER BY e.fechaEnvio DESC")
        Page<Salida> findByFechaAndReferenciaOrderByFechaEnvioDesc(
                        @Param("fechaInicio") LocalDate fechaInicio,
                        @Param("fechaFin") LocalDate fechaFin,
                        @Param("referencia") String referencia,
                        Pageable pageable);

        // Buscar por descripción dentro de un rango de fechas
        @Query("SELECT DISTINCT e FROM Salida e JOIN e.productos p WHERE DATE(e.fechaEnvio) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.description) LIKE LOWER(CONCAT('%', :descripcion, '%')) AND e.estado = true ORDER BY e.fechaEnvio DESC")
        Page<Salida> findByFechaAndDescripcionOrderByFechaEnvioDesc(
                        @Param("fechaInicio") LocalDate fechaInicio,
                        @Param("fechaFin") LocalDate fechaFin,
                        @Param("descripcion") String descripcion,
                        Pageable pageable);

        // Buscar por observación dentro de un rango de fechas
        @Query("SELECT DISTINCT e FROM Salida e JOIN e.productos p WHERE DATE(e.fechaEnvio) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.observaciones) LIKE LOWER(CONCAT('%', :observacion, '%')) AND e.estado = true ORDER BY e.fechaEnvio DESC")
        Page<Salida> findByFechaAndObservacionOrderByFechaEnvioDesc(
                        @Param("fechaInicio") LocalDate fechaInicio,
                        @Param("fechaFin") LocalDate fechaFin,
                        @Param("observacion") String observacion,
                        Pageable pageable);

        // Buscar por destino dentro de un rango de fechas
        @Query("SELECT s FROM Salida s WHERE " +
                        "DATE(s.fechaEnvio) BETWEEN :fechaInicio AND :fechaFin AND " +
                        "(:textoBusqueda IS NULL OR " +
                        "LOWER(s.destino) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.colaborador) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.pdv) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.perfumeria) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.direccion) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.poblacion) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.provincia) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.cp) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.telefono) LIKE LOWER(CONCAT('%', :textoBusqueda, '%'))) " +
                        "AND s.estado = true " +
                        "ORDER BY s.fechaEnvio DESC")
                        Page<Salida> findByFechaEnvioAndCamposOrderByFechaEnvioDesc(
                        @Param("fechaInicio") LocalDate fechaInicio,
                        @Param("fechaFin") LocalDate fechaFin,
                        @Param("textoBusqueda") String textoBusqueda,
                        Pageable pageable);

        // Buscar salidas solo por rango de fechas
        @Query("SELECT e FROM Salida e WHERE DATE(e.fechaEnvio) BETWEEN :fechaInicio AND :fechaFin AND e.estado = :estado ORDER BY e.fechaEnvio DESC")
        Iterable<Salida> findByFechaEnvioBetweenAndEstadoOrderByFechaEnvioDesc(
                        @Param("fechaInicio") LocalDate fechaInicio,
                        @Param("fechaFin") LocalDate fechaFin,
                        @Param("estado") boolean estado);

        // Buscar por referencia dentro de un rango de fechas
        @Query("SELECT DISTINCT e FROM Salida e JOIN e.productos p WHERE DATE(e.fechaEnvio) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.ref) LIKE LOWER(CONCAT('%', :referencia, '%')) AND e.estado = true ORDER BY e.fechaEnvio DESC")
        Iterable<Salida> findByFechaAndReferenciaOrderByFechaEnvioDesc(
                        @Param("fechaInicio") LocalDate fechaInicio,
                        @Param("fechaFin") LocalDate fechaFin,
                        @Param("referencia") String referencia);

        // Buscar por descripción dentro de un rango de fechas
        @Query("SELECT DISTINCT e FROM Salida e JOIN e.productos p WHERE DATE(e.fechaEnvio) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.description) LIKE LOWER(CONCAT('%', :descripcion, '%')) AND e.estado = true ORDER BY e.fechaEnvio DESC")
        Iterable<Salida> findByFechaAndDescripcionOrderByFechaEnvioDesc(
                        @Param("fechaInicio") LocalDate fechaInicio,
                        @Param("fechaFin") LocalDate fechaFin,
                        @Param("descripcion") String descripcion);

        // Buscar por observación dentro de un rango de fechas
        @Query("SELECT DISTINCT e FROM Salida e JOIN e.productos p WHERE DATE(e.fechaEnvio) BETWEEN :fechaInicio AND :fechaFin AND LOWER(p.observaciones) LIKE LOWER(CONCAT('%', :observacion, '%')) AND e.estado = true ORDER BY e.fechaEnvio DESC")
        Iterable<Salida> findByFechaAndObservacionOrderByFechaEnvioDesc(
                        @Param("fechaInicio") LocalDate fechaInicio,
                        @Param("fechaFin") LocalDate fechaFin,
                        @Param("observacion") String observacion);

        // Buscar por destino dentro de un rango de fechas
        @Query("SELECT s FROM Salida s WHERE " +
                        "DATE(s.fechaEnvio) BETWEEN :fechaInicio AND :fechaFin AND " +
                        "(:textoBusqueda IS NULL OR " +
                        "LOWER(s.destino) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.colaborador) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.pdv) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.perfumeria) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.direccion) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.poblacion) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.provincia) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.cp) LIKE LOWER(CONCAT('%', :textoBusqueda, '%')) OR " +
                        "LOWER(s.telefono) LIKE LOWER(CONCAT('%', :textoBusqueda, '%'))) " +
                        "AND s.estado = true " +
                        "ORDER BY s.fechaEnvio DESC")
                        Iterable<Salida> findByFechaEnvioAndCamposOrderByFechaEnvioDesc(
                        @Param("fechaInicio") LocalDate fechaInicio,
                        @Param("fechaFin") LocalDate fechaFin,
                        @Param("textoBusqueda") String textoBusqueda);
}
