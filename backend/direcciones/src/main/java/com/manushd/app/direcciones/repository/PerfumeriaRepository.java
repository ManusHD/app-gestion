package com.manushd.app.direcciones.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.direcciones.models.PDV;
import com.manushd.app.direcciones.models.Perfumeria;

@RestResource(path="perfumerias", rel="perfumeria")
public interface PerfumeriaRepository extends CrudRepository<Perfumeria, Long> {
        
        Optional<Perfumeria> findByNombre(String Nombre);

        Iterable<Perfumeria> findAllByOrderByNombreAsc();
        
        Iterable<Perfumeria> findAllByActivaOrderByNombreAsc(boolean activa);

        Iterable<Perfumeria> findByNombreContainingIgnoreCase(String nombre);

        Iterable<Perfumeria> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

        Iterable<Perfumeria> findByPdvsNombreOrderByNombreAsc(String nombre);

        @Query("SELECT p FROM Perfumeria p JOIN p.pdvs pdv WHERE pdv.nombre LIKE %:nombre% OR pdv.direccion LIKE %:direccion% OR pdv.telefono LIKE %:telefono% ORDER BY pdv.nombre")
        Iterable<Perfumeria> findByPdvsAttributes(@Param("nombre") String nombre, @Param("direccion") String direccion, @Param("telefono") String telefono);

        @Query("SELECT p.pdvs FROM Perfumeria p WHERE p.id = :perfumeriaId")
        Iterable<PDV> findPDVsByPerfumeriaId(@Param("perfumeriaId") Long perfumeriaId);
}
