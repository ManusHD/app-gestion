package com.manushd.app.tarifas.repository;

import com.manushd.app.tarifas.models.Tarifa;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;

@RestResource(path = "tarifas", rel = "tarifa")
public interface TarifaRepository extends PagingAndSortingRepository<Tarifa, Long> {

    Page<Tarifa> findAllByNombre(String nombre, Pageable pageable);

    Iterable<Tarifa> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

    Page<Tarifa> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre, Pageable pageable);

    Optional<Tarifa> findById(Long id);

    Optional<Tarifa> findByNombre(String nombre);

    Iterable<Tarifa> findAll();

    Tarifa save(Tarifa tarifa);

    void deleteById(Long id);
}