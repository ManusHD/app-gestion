package com.manushd.app.estados.controllers;

import com.manushd.app.estados.models.CambioEstadoRequest;
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

    private String productosServiceUrl = "http://localhost:8091";
    private String ubicacionesServiceUrl = "http://localhost:8095";

    @GetMapping("")
    public Iterable<Estado> getEstados() {
        return estadoRepository.findAllOrderByNombreAsc();
    }

    @GetMapping("/pageable")
    public Page<Estado> getEstadosPageable(
            @RequestParam(value = "nombre", required = false) String nombre,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());
        if (nombre != null && !nombre.isEmpty()) {
            return estadoRepository.findByNombreContainingIgnoreCaseOrderByNombreAsc(nombre, pageable);
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
        return estadoRepository.findByNombreContainingIgnoreCaseOrderByNombreAsc(nombre, pageable);
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
    public Estado updateEstado(@PathVariable Long id, @RequestBody Estado estado,
            @RequestHeader("Authorization") String token) {
        Estado existingEstado = estadoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estado no encontrado"));

        if (estado.getNombre() == null || estado.getNombre().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del estado no puede estar vacío");
        }

        String nombreAnterior = existingEstado.getNombre();
        String nombreNuevo = estado.getNombre();

        if (!nombreAnterior.equals(nombreNuevo) &&
                estadoRepository.findByNombre(nombreNuevo).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un estado con ese nombre");
        }

        existingEstado.setNombre(nombreNuevo);
        Estado estadoActualizado = estadoRepository.save(existingEstado);

        // Si el nombre cambió, propagar el cambio a otros microservicios
        if (!nombreAnterior.equals(nombreNuevo)) {
            propagarCambioEstado(nombreAnterior, nombreNuevo, token);
        }

        return estadoActualizado;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEstado(@PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        Estado estado = estadoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estado no encontrado"));

        // Verificar si el estado está siendo usado
        if (verificarEstadoEnUso(estado.getNombre(), token)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar el estado porque está siendo utilizado por productos");
        }

        estadoRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/en-uso")
    public ResponseEntity<Boolean> verificarEstadoEnUso(@PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        Estado estado = estadoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estado no encontrado"));

        boolean enUso = verificarEstadoEnUso(estado.getNombre(), token);
        return ResponseEntity.ok(enUso);
    }

    // Métodos privados actualizados:
    private boolean verificarEstadoEnUso(String nombreEstado, String token) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", token);

            // Verificar en microservicio de productos
            String urlProductos = productosServiceUrl + "/productos/verificar-estado/" + nombreEstado;
            HttpEntity<String> requestEntity = new HttpEntity<>(headers);
            ResponseEntity<Boolean> responseProductos = restTemplate.exchange(
                    urlProductos, HttpMethod.GET, requestEntity, Boolean.class);

            if (Boolean.TRUE.equals(responseProductos.getBody())) {
                return true;
            }

            // Verificar en microservicio de ubicaciones
            String urlUbicaciones = ubicacionesServiceUrl + "/ubicaciones/verificar-estado/" + nombreEstado;
            ResponseEntity<Boolean> responseUbicaciones = restTemplate.exchange(
                    urlUbicaciones, HttpMethod.GET, requestEntity, Boolean.class);

            return Boolean.TRUE.equals(responseUbicaciones.getBody());

        } catch (Exception e) {
            System.err.println("Error verificando estado en uso: " + e.getMessage());
            return true;
        }
    }

    private void propagarCambioEstado(String nombreAnterior, String nombreNuevo, String token) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("Authorization", token);

            CambioEstadoRequest request = new CambioEstadoRequest(nombreAnterior, nombreNuevo);
            HttpEntity<CambioEstadoRequest> requestEntity = new HttpEntity<>(request, headers);

            // Actualizar en microservicio de productos
            String urlProductos = productosServiceUrl + "/productos/actualizar-estado";
            ResponseEntity<String> responseProductos = restTemplate.postForEntity(urlProductos, requestEntity,
                    String.class);
            System.out.println("Respuesta productos: " + responseProductos.getBody());

            // Actualizar en microservicio de ubicaciones
            String urlUbicaciones = ubicacionesServiceUrl + "/ubicaciones/actualizar-estado";
            ResponseEntity<String> responseUbicaciones = restTemplate.postForEntity(urlUbicaciones, requestEntity,
                    String.class);
            System.out.println("Respuesta ubicaciones: " + responseUbicaciones.getBody());

        } catch (Exception e) {
            System.err.println("Error propagando cambio de estado: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
