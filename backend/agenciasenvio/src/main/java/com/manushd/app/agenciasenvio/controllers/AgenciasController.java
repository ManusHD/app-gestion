package com.manushd.app.agenciasenvio.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PutMapping;

import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.HttpClientErrorException;

import com.manushd.app.agenciasenvio.models.Agencia;
import com.manushd.app.agenciasenvio.repository.AgenciaRepository;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RestController
@RequestMapping("/agenciasEnvio")
@PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
public class AgenciasController {
    @Autowired
    private AgenciaRepository agenciaRepository;

    @GetMapping("")
    public Iterable<Agencia> getAgencias() {
        return agenciaRepository.findAll();
    }

    @GetMapping("/byNombre")
    public Iterable<Agencia> getAgenciasOrderByNombre() {
        return agenciaRepository.findAllByOrderByNombreAsc();
    }

    @GetMapping("/activas")
    public Iterable<Agencia> getAgenciasActivas() {
        return agenciaRepository.findAllByActivaOrderByNombreAsc(true);
    }

    @GetMapping("/{id}")
    public Agencia getAgenciaById(@PathVariable Long id) {
        return agenciaRepository.findById(id).orElse(null);
    }

    @GetMapping("/nombre/{nombre}")
    public Agencia obtenerAgenciaPorNombre(@PathVariable String nombre) {
        return agenciaRepository.findByNombre(nombre).orElse(null);
    }

    @GetMapping("/byNombre/{nombre}")
    public Iterable<Agencia> obtenerAgenciasPorNombre(@PathVariable String nombre) {
        return agenciaRepository.findByNombreContainingIgnoreCaseOrderByNombreAsc(nombre);
    }

    @PostMapping("")
    @PreAuthorize("hasRole('ADMIN')")
    public Agencia addAgencia(@RequestBody Agencia agencia) {
        Agencia agenciaAux = agenciaRepository.findByNombre(agencia.getNombre()).orElse(null);

        if (agenciaAux != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La agencia ya existe");
        }

        return agenciaRepository.save(agencia);
    }   

    @PutMapping("")
    @PreAuthorize("hasRole('ADMIN')")
    public Agencia updateAgencia(@RequestBody Agencia agencia) {
        Agencia agenciaAux = agenciaRepository.findById(agencia.getId()).orElse(null);

        if (agenciaAux == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La agencia no existe");
        }

        return agenciaRepository.save(agencia);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAgencia(@PathVariable Long id) {
        Agencia agenciaAux = agenciaRepository.findById(id).orElse(null);

        if (agenciaAux == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La agencia no existe");
        }

        agenciaRepository.delete(agenciaAux);
    }

}