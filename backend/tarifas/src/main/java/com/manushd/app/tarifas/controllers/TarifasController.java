package com.manushd.app.tarifas.controllers;

import com.manushd.app.tarifas.models.Tarifa;
import com.manushd.app.tarifas.repository.TarifaRepository;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

@Controller
@RestController
@RequestMapping("/tarifas")
@PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
public class TarifaController {
    @Autowired
    private TarifaRepository tarifaRepository;

    @GetMapping("")
    public Page<Tarifa> getTarifasPageable(
            @RequestParam(value = "nombre", required = false) String nombre,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());
        if (nombre != null && !nombre.isEmpty()) {
            return tarifaRepository.findByNombreContainingIgnoreCaseOrderByNombreAsc(nombre, pageable);
        }
        return tarifaRepository.findAll(pageable);
    }

    @GetMapping("/{id}")
    public Tarifa getTarifaById(@PathVariable Long id) {
        return tarifaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarifa no encontrada"));
    }

    @GetMapping("nombre/{nombre}")
    public Tarifa getTarifaByNombre(@PathVariable String nombre) {
        return tarifaRepository.findByNombre(nombre)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarifa no encontrada"));
    }

    @GetMapping("nombre/{nombre}/pageable")
    public Page<Tarifa> getTarifasByNombre(
            @PathVariable String nombre,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());
        return tarifaRepository.findByNombreContainingIgnoreCaseOrderByNombreAsc(nombre, pageable);
    }

    @PostMapping("")
    public Tarifa createTarifa(@RequestBody Tarifa tarifa) {
        if (tarifa.getNombre() == null || tarifa.getNombre().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de la tarifa no puede estar vacío");
        }
        if (tarifa.getImporte() == null || tarifa.getImporte().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El importe debe ser mayor o igual a 0");
        }
        if (tarifaRepository.findByNombre(tarifa.getNombre()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una tarifa con ese nombre");
        }
        return tarifaRepository.save(tarifa);
    }

    @PutMapping("/{id}")
    public Tarifa updateTarifa(@PathVariable Long id, @RequestBody Tarifa tarifa,
            @RequestHeader("Authorization") String token) {
        Tarifa existingTarifa = tarifaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarifa no encontrada"));

        if (tarifa.getNombre() == null || tarifa.getNombre().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de la tarifa no puede estar vacío");
        }
        if (tarifa.getImporte() == null || tarifa.getImporte().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El importe debe ser mayor o igual a 0");
        }

        String nombreAnterior = existingTarifa.getNombre();
        String nombreNuevo = tarifa.getNombre();
        BigDecimal importeAnterior = existingTarifa.getImporte();
        BigDecimal importeNuevo = tarifa.getImporte();

        if (!nombreAnterior.equals(nombreNuevo) &&
                tarifaRepository.findByNombre(nombreNuevo).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una tarifa con ese nombre");
        }

        existingTarifa.setNombre(nombreNuevo);
        existingTarifa.setImporte(importeNuevo);
        Tarifa tarifaActualizada = tarifaRepository.save(existingTarifa);

        // Si cambió algo, propagar el cambio a otros microservicios
        if (!nombreAnterior.equals(nombreNuevo) || importeAnterior.compareTo(importeNuevo) != 0) {
            propagarCambioTarifa(nombreAnterior, nombreNuevo, 
                               importeAnterior.doubleValue(), importeNuevo.doubleValue(), token);
        }

        return tarifaActualizada;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTarifa(@PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        Tarifa tarifa = tarifaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarifa no encontrada"));

        // Verificar si la tarifa está siendo usada
        if (verificarTarifaEnUso(tarifa.getNombre(), token)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar la tarifa porque está siendo utilizada");
        }

        tarifaRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}