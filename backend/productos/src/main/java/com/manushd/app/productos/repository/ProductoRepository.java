package com.manushd.app.productos.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;

import com.manushd.app.productos.models.Producto;

public interface ProductoRepository extends PagingAndSortingRepository<Producto, Long> {

    Optional<Producto> findByReferencia(String referencia);

    Page<Producto> findAllByOrderByReferenciaAsc(Pageable pageable);
    Iterable<Producto> findAllByOrderByReferenciaAsc();

    Page<Producto> findByReferenciaContainingIgnoreCaseOrderByReferenciaAsc(
            String referencia, Pageable pageable);
    Iterable<Producto> findByReferenciaContainingIgnoreCaseOrderByReferenciaAsc(
            String referencia);

    Page<Producto> findByReferenciaContainingIgnoreCaseOrderByDescriptionAsc(
            String referencia, Pageable pageable);

    Page<Producto> findByDescriptionContainingIgnoreCaseOrderByDescriptionAsc(
            String description, Pageable pageable);
    Iterable<Producto> findByDescriptionContainingIgnoreCaseOrderByDescriptionAsc(
            String description);

    Page<Producto> findByReferenciaContainingIgnoreCase(
            String referencia, Pageable pageable);

    Page<Producto> findByReferenciaAndDescriptionContainingIgnoreCaseOrderByDescriptionAsc(
            String referencia, String description, Pageable pageable);

    Optional<Producto> findByReferenciaAndDescription(
            String referencia, String description);

    Iterable<Producto> findAll();

    Optional<Producto> findById(Long id);

    Producto save(Producto producto);

    void deleteById(Long id);

    void delete(Producto producto);
}
