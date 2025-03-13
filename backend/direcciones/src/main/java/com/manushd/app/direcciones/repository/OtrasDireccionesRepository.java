package com.manushd.app.direcciones.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.direcciones.models.OtrasDirecciones;

@RestResource(path = "otrasDirecciones", rel = "otraDireccion")
public interface OtrasDireccionesRepository extends PagingAndSortingRepository<OtrasDirecciones, Long> {

    Optional<OtrasDirecciones> findByNombre(String Nombre);

    Page<OtrasDirecciones> findAllByOrderByNombreAsc(Pageable pageable);
    Iterable<OtrasDirecciones> findAllByOrderByNombreAsc();

    Iterable<OtrasDirecciones> findByNombreContainingIgnoreCase(String nombre);

    Page<OtrasDirecciones> findByNombreContainingIgnoreCaseOrderByNombreAsc(Pageable pageable, String nombre);
    Iterable<OtrasDirecciones> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

    Iterable<OtrasDirecciones> findAll();

    Optional<OtrasDirecciones> findById(Long id);

    OtrasDirecciones save(OtrasDirecciones otrasDirecciones);

    void deleteById(Long id);

    void delete(OtrasDirecciones otrasDirecciones);
}
