package com.manushd.app.trabajos.controllers;

import com.manushd.app.trabajos.models.Trabajo;
import com.manushd.app.trabajos.repository.TrabajoRepository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

@Controller
@RestController
@RequestMapping("/trabajos")
@PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
public class TrabajoController {

    @Autowired
    private TrabajoRepository trabajoRepository;

    @GetMapping("")
    public Page<Trabajo> getTrabajos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fecha") String sort) {
        return trabajoRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sort)));
    }

    @GetMapping("/{id}")
    public Trabajo getTrabajoById(@PathVariable Long id) {
        return trabajoRepository.findById(id).orElse(null);
    }

    @GetMapping("/estado/{estado}")
    public Iterable<Trabajo> getTrabajosByEstado(@PathVariable boolean estado) {
        return trabajoRepository.findAllByEstadoOrderByFechaDesc(estado);
    }

    @GetMapping("/estado/{estado}/paginado")
    public Page<Trabajo> getTrabajosOrdenadasByEstado(
            @PathVariable boolean estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return trabajoRepository.findAllByEstadoOrderByFechaDesc(
                estado, PageRequest.of(page, size));
    }

    @GetMapping("/filtrar/paginado")
    public ResponseEntity<Page<Trabajo>> filtrarTrabajosPaginado(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam String tipoBusqueda,
            @RequestParam(required = false) String textoBusqueda,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Trabajo> trabajos = buscarTrabajosFiltradasPaginado(
                fechaInicio, fechaFin, tipoBusqueda, textoBusqueda,
                PageRequest.of(page, size));

        return ResponseEntity.ok(trabajos);
    }

    private Page<Trabajo> buscarTrabajosFiltradasPaginado(
            LocalDate fechaInicio,
            LocalDate fechaFin,
            String tipoBusqueda,
            String textoBusqueda,
            Pageable pageable) {

        // Si no hay texto de búsqueda, solo filtrar por fechas
        if (textoBusqueda == null || textoBusqueda.trim().isEmpty()) {
            return trabajoRepository.findByFechaBetweenAndEstadoOrderByFechaDesc(
                    fechaInicio, fechaFin, true, pageable);
        }

        // Si hay texto, filtrar según el tipo de búsqueda
        switch (tipoBusqueda) {
            case "concepto":
                return trabajoRepository.findByFechaAndConceptoOrderByFechaDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            case "direccion":
                return trabajoRepository.findByFechaAndDireccionOrderByFechaDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            case "observacion":
                return trabajoRepository.findByFechaAndObservacionOrderByFechaDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            default:
                return trabajoRepository.findByFechaBetweenAndEstadoOrderByFechaDesc(
                        fechaInicio, fechaFin, true, pageable);
        }
    }

    @GetMapping("/filtrar")
    public ResponseEntity<Iterable<Trabajo>> filtrarTrabajos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam String tipoBusqueda,
            @RequestParam(required = false) String textoBusqueda) {

        Iterable<Trabajo> trabajos = buscarTrabajosFiltradasSinPaginacion(
                fechaInicio, fechaFin, tipoBusqueda, textoBusqueda);

        return ResponseEntity.ok(trabajos);
    }

    private Iterable<Trabajo> buscarTrabajosFiltradasSinPaginacion(
            LocalDate fechaInicio,
            LocalDate fechaFin,
            String tipoBusqueda,
            String textoBusqueda) {

        // Si no hay texto de búsqueda, solo filtrar por fechas
        if (textoBusqueda == null || textoBusqueda.trim().isEmpty()) {
            return trabajoRepository.findByFechaBetweenAndEstadoOrderByFechaDesc(
                    fechaInicio, fechaFin, true);
        }

        // Si hay texto, filtrar según el tipo de búsqueda
        switch (tipoBusqueda) {
            case "concepto":
                return trabajoRepository.findByFechaAndConceptoOrderByFechaDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            case "direccion":
                return trabajoRepository.findByFechaAndDireccionOrderByFechaDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            case "observacion":
                return trabajoRepository.findByFechaAndObservacionOrderByFechaDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            default:
                return trabajoRepository.findByFechaBetweenAndEstadoOrderByFechaDesc(
                        fechaInicio, fechaFin, true);
        }
    }

    @PostMapping("")
    public ResponseEntity<?> addTrabajo(@RequestBody Trabajo trabajo) {
        if (trabajo.getEstado() == null) {
            trabajo.setEstado(false); // Por defecto es previsión
        }
        
        // Validaciones básicas
        if (trabajo.getFecha() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La fecha es obligatoria");
        }

        if (trabajo.getConcepto() == null || trabajo.getConcepto().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("El concepto es obligatorio");
        }

        if (trabajo.getHoras() == null || trabajo.getHoras().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Las horas deben ser mayor que 0");
        }

        // Validar que tenga al menos una dirección
        boolean tienePerfumeriaPdv = trabajo.getPerfumeria() != null && !trabajo.getPerfumeria().trim().isEmpty() &&
                                    trabajo.getPdv() != null && !trabajo.getPdv().trim().isEmpty();
        boolean tieneOtroOrigen = trabajo.getOtroOrigen() != null && !trabajo.getOtroOrigen().trim().isEmpty();

        if (!tienePerfumeriaPdv && !tieneOtroOrigen) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Debe especificar una dirección (Perfumería + PDV o Otro Origen)");
        }

        Trabajo savedTrabajo = trabajoRepository.save(trabajo);
        return ResponseEntity.ok(savedTrabajo);
    }

    @PutMapping("/{id}")
    public Trabajo updateTrabajo(@PathVariable Long id, @RequestBody Trabajo trabajo) {
        Trabajo trabajoAux = trabajoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trabajo no encontrado"));
        
        trabajo.setId(id); // Asegurar que mantenga el ID
        return trabajoRepository.save(trabajo);
    }

    @PutMapping("/{id}/realizar")
    public ResponseEntity<?> marcarComoRealizado(@PathVariable Long id) {
        Optional<Trabajo> trabajoOpt = trabajoRepository.findById(id);
        
        if (trabajoOpt.isPresent()) {
            Trabajo trabajo = trabajoOpt.get();
            trabajo.setEstado(true); // Marcar como realizado
            Trabajo savedTrabajo = trabajoRepository.save(trabajo);
            return ResponseEntity.ok(savedTrabajo);
        }
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Trabajo no encontrado");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteById(@PathVariable Long id) {
        trabajoRepository.deleteById(id);
    }
}