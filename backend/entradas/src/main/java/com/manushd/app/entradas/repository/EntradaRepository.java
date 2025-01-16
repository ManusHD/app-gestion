package com.manushd.app.entradas.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RestResource;
import org.springframework.data.jpa.repository.Query;

import com.manushd.app.entradas.models.Entrada;

@RestResource(path="entradas", rel="entrada")
public interface EntradaRepository extends CrudRepository<Entrada, Long> {

    Iterable<Entrada> findAllByEstado(boolean estado);

    Iterable<Entrada> findAllByEstadoOrderByFechaRecepcionAsc(boolean estado);

    @Query("SELECT e FROM Entrada e JOIN e.productos p WHERE p.id = :productoId")
    Entrada findEntradaByProductoPendiente(@Param("productoId") Long productoId);
}

