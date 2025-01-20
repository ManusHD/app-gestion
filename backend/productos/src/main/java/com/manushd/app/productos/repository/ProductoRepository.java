package com.manushd.app.productos.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import com.manushd.app.productos.models.Producto;

public interface ProductoRepository extends CrudRepository<Producto, Long>{

    Optional<Producto> findByReferencia(String referencia);

    Iterable<Producto> findAllByOrderByReferenciaAsc();

    Iterable<Producto> findByReferenciaContainingIgnoreCaseOrderByReferenciaAsc(String referencia);

    Iterable<Producto> findByDescriptionContainingIgnoreCase(String description);

    Iterable<Producto> findByReferenciaContainingIgnoreCase(String referencia);
    
}
