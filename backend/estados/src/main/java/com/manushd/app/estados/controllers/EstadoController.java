package com.manushd.app.estados.controllers;

import com.manushd.app.estados.models.Estado;
import com.manushd.app.estados.repository.EstadoRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

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
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;



@Controller
@RestController
@RequestMapping("/estados")
@PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
public class EstadoController {
    @Autowired
    private EstadoRepository estadoRepository;

    @GetMapping("")
    public Iterable<Estado> getEstados() {
        return estadoRepository.findAll();
    }

    @GetMapping("/pageable")
    public Page<Estado> getEstadosPageable(
            @RequestParam(value = "nombre", required = false) String nombre,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());
        if (nombre != null && !nombre.isEmpty()) {
            return estadoRepository.findAllByNombreOrderByNombreAsc(nombre, pageable);
        }
        return estadoRepository.findAll(pageable);
    }

    @GetMapping("/{id}")
    public Estado getEstadoById(@PathVariable Long id) {
        return estadoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estado no encontrado"));
    }

    @GetMapping("nombre/{nombre}")
    public Page<Estado> getEstadosByNombre(
            @PathVariable String nombre,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());
        return estadoRepository.findAllByNombreOrderByNombreAsc(nombre, pageable);
    }

    @PostMapping("")
    public Estado createEstado(@RequestBody Estado estado) {
        if (estado.getNombre() == null || estado.getNombre().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del estado no puede estar vacío");
        }
        if (estadoRepository.findByNombre(estado.getNombre()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un estado con ese nombre");

        }
        return estadoRepository.save(estado);
    }

    @PutMapping("/{id}")
    public Estado updateEstado(@PathVariable Long id, @RequestBody Estado estado) {
        Estado existingEstado = estadoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estado no encontrado"));

        if (estado.getNombre() == null || estado.getNombre().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del estado no puede estar vacío");
        }

        if (!existingEstado.getNombre().equals(estado.getNombre()) &&
                estadoRepository.findByNombre(estado.getNombre()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un estado con ese nombre");
        }

        existingEstado.setNombre(estado.getNombre());
        return estadoRepository.save(existingEstado);
    }

    @DeleteMapping("/{id}")
    public void deleteEstado(@PathVariable Long id) {
        Estado e = estadoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estado no encontrado"));
    }
}
