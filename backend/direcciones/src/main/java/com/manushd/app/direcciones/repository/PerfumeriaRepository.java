package com.manushd.app.direcciones.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.direcciones.models.PDV;
import com.manushd.app.direcciones.models.Perfumeria;

@RestResource(path="perfumerias", rel="perfumeria")
public interface PerfumeriaRepository extends PagingAndSortingRepository<Perfumeria, Long> {
        
        Optional<Perfumeria> findByNombre(String Nombre);

        Page<Perfumeria> findAllByOrderByNombreAsc(Pageable pageable);
        Iterable<Perfumeria> findAllByOrderByNombreAsc();
        
        Page<Perfumeria> findAllByActivaOrderByNombreAsc(Pageable pageable, boolean activa);
        Iterable<Perfumeria> findAllByActivaOrderByNombreAsc(boolean activa);

        Iterable<Perfumeria> findByNombreContainingIgnoreCase(String nombre);

        Page<Perfumeria> findByNombreContainingIgnoreCaseOrderByNombreAsc(Pageable pageable, String nombre);
        Iterable<Perfumeria> findByNombreContainingIgnoreCaseOrderByNombreAsc(String nombre);

        Page<Perfumeria> findByActivaAndNombreContainingIgnoreCaseOrderByNombreAsc(Pageable pageable, boolean activa, String nombre);
        Iterable<Perfumeria> findByActivaAndNombreContainingIgnoreCaseOrderByNombreAsc(boolean activa, String nombre);

        Page<Perfumeria> findByPdvsNombreOrderByNombreAsc(Pageable pageable, String nombre);
        Iterable<Perfumeria> findByPdvsNombreOrderByNombreAsc(String nombre);

        @Query("SELECT p FROM Perfumeria p JOIN p.pdvs pdv WHERE pdv.nombre LIKE %:nombre% OR pdv.direccion LIKE %:direccion% OR pdv.telefono LIKE %:telefono% ORDER BY pdv.nombre")
        Iterable<Perfumeria> findByPdvsAttributes(@Param("nombre") String nombre, @Param("direccion") String direccion, @Param("telefono") String telefono);

        @Query("SELECT pdv FROM Perfumeria p JOIN p.pdvs pdv WHERE p.id = :perfumeriaId ORDER BY pdv.nombre ASC")
        Iterable<PDV> findPDVsByPerfumeriaId(@Param("perfumeriaId") Long perfumeriaId);

        @Query("SELECT pdv FROM PDV pdv WHERE pdv NOT IN (SELECT p.pdvs FROM Perfumeria p) ORDER BY pdv.nombre")
        Iterable<PDV> findPDVsNotRelatedToAnyPerfumeria();

        Iterable<Perfumeria> findAll();
    
        Optional<Perfumeria> findById(Long id);
    
        Perfumeria save(Perfumeria perfumeria);
    
        void deleteById(Long id);
    
        void delete(Perfumeria perfumeria);
}
