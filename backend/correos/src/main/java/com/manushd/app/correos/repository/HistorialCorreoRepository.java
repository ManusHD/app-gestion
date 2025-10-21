package com.manushd.app.correos.repository;

import com.manushd.app.correos.models.HistorialCorreo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HistorialCorreoRepository extends JpaRepository<HistorialCorreo, Long> {
    Page<HistorialCorreo> findAllByOrderByFechaEnvioDesc(Pageable pageable);
    List<HistorialCorreo> findBySalidaId(Long salidaId);
    Page<HistorialCorreo> findByDestinatarioContainingIgnoreCase(String destinatario, Pageable pageable);
    Page<HistorialCorreo> findByFechaEnvioBetween(LocalDateTime inicio, LocalDateTime fin, Pageable pageable);
}