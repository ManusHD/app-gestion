package com.manushd.app.productos.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;

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

        List<Producto> findByEstado(String estado);

        Producto save(Producto producto);

        Producto saveAll(Iterable<Producto> productos);

        void deleteById(Long id);

        void delete(Producto producto);

        // Buscar productos agrupados por referencia y estado
        @Query("SELECT p FROM Producto p WHERE p.referencia NOT IN ('VISUAL', 'SIN REFERENCIA') ORDER BY p.referencia ASC, COALESCE(p.estado, 'SIN ESTADO') ASC")
        Page<Producto> findProductosNormalesOrderByReferenciaAndEstado(Pageable pageable);

        @Query("SELECT p FROM Producto p WHERE p.referencia NOT IN ('VISUAL', 'SIN REFERENCIA') ORDER BY p.referencia ASC, COALESCE(p.estado, 'SIN ESTADO') ASC")
        Iterable<Producto> findProductosNormalesOrderByReferenciaAndEstado();

        // Buscar por referencia y estado específicos
        List<Producto> findByReferenciaAndEstadoOrderByReferenciaAsc(String referencia, String estado);
        Optional<Producto> findByReferenciaAndEstado(String referencia, String estado);

        // Buscar productos por referencia (excluyendo especiales)
        @Query("SELECT p FROM Producto p WHERE p.referencia = :referencia AND p.referencia NOT IN ('VISUAL', 'SIN REFERENCIA') ORDER BY p.estado ASC")
        List<Producto> findByReferenciaExcludingSpecial(@Param("referencia") String referencia);

        @Query("SELECT p FROM Producto p WHERE p.referencia = :referencia ORDER BY COALESCE(p.estado, 'SIN ESTADO') ASC")
        List<Producto> findByReferenciaOrderByEstadoAsc(@Param("referencia") String referencia);
}
