package com.manushd.app.direcciones.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.direcciones.models.Colaborador;

@RestResource(path = "colaboradores", rel = "colaborador")
public interface ColaboradoresRepository extends PagingAndSortingRepository<Colaborador, Long> {

        Optional<Colaborador> findByNombre(String Nombre);

        Page<Colaborador> findAllByOrderByNombreAsc(Pageable pageable);
        Iterable<Colaborador> findAllByOrderByNombreAsc();

        Page<Colaborador> findAllByActivaOrderByNombreAsc(boolean activa, Pageable pageable);
        Iterable<Colaborador> findAllByActivaOrderByNombreAsc(boolean activa);

        Iterable<Colaborador> findByNombreContainingIgnoreCase(String nombre);

        Page<Colaborador> findByNombreContainingIgnoreCaseOrderByNombreAsc(Pageable pageable, String nombre);
        Iterable<Colaborador> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

        Iterable<Colaborador> findAll();

        Optional<Colaborador> findById(Long id);

        Colaborador save(Colaborador colaborador);

        void deleteById(Long id);

        void delete(Colaborador colaborador);

}
