package com.manushd.app.direcciones.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.direcciones.models.PDV;

@RestResource(path = "pdvs", rel = "pdv")
public interface PDVrepository extends PagingAndSortingRepository<PDV, Long> {

        Optional<PDV> findByNombre(String Nombre);

        Page<PDV> findAllByOrderByNombreAsc(Pageable pageable);
        Iterable<PDV> findAllByOrderByNombreAsc();

        Iterable<PDV> findByNombreContainingIgnoreCase(String nombre);

        Page<PDV> findByNombreContainingIgnoreCaseOrderByNombreAsc(Pageable pageable, String nombre);
        Iterable<PDV> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

        Iterable<PDV> findAll();

        Optional<PDV> findById(Long id);

        PDV save(PDV pdv);

        void deleteById(Long id);

        void delete(PDV pdv);
}
