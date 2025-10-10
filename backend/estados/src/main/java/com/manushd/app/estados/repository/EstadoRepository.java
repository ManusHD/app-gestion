package com.manushd.app.estados.repository;

import com.manushd.app.estados.models.Estado;

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

import com.manushd.app.estados.models.Estado;


@RestResource(path = "estados", rel = "estado")
public interface EstadoRepository extends PagingAndSortingRepository<Estado, Long> {

    @Query("SELECT e FROM Estado e ORDER BY e.nombre ASC")
    Iterable<Estado> findAllOrderByNombreAsc();

    Page<Estado> findAllByNombre(String nombre, Pageable pageable);

    Iterable<Estado> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

    Page<Estado> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre, Pageable pageable);

    Optional<Estado> findById(Long id);

    Optional<Estado> findByNombre(String nombre);

    Iterable<Estado> findAll();

    Estado save(Estado estado);

    void deleteById(Long id);
 
}
