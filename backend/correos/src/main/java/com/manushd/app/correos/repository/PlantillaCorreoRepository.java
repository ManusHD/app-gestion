package com.manushd.app.correos.repository;

import com.manushd.app.correos.models.PlantillaCorreo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlantillaCorreoRepository extends JpaRepository<PlantillaCorreo, Long> {
    Optional<PlantillaCorreo> findByAlias(String alias);
    List<PlantillaCorreo> findByActivaTrue();
    Page<PlantillaCorreo> findByActivaTrue(Pageable pageable);
    Page<PlantillaCorreo> findByAliasContainingIgnoreCase(String alias, Pageable pageable);
    boolean existsByAlias(String alias);
}