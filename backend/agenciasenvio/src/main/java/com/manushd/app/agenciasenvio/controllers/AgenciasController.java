package com.manushd.app.agenciasenvio.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;

import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.HttpClientErrorException;

import com.manushd.app.agenciasenvio.models.Agencia;
import com.manushd.app.agenciasenvio.repository.AgenciaRepository;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RestController
@CrossOrigin(value = "http://localhost:4200")
public class AgenciasController {
    @Autowired
    private AgenciaRepository agenciaRepository;

    @GetMapping("/agenciasEnvio")
    public Iterable<Agencia> getAgencias() {
        return agenciaRepository.findAll();
    }

    @GetMapping("/agenciasEnvio/byNombre")
    public Iterable<Agencia> getAgenciasOrderByNombre() {
        return agenciaRepository.findAllByOrderByNombreAsc();
    }

    @GetMapping("/agenciasEnvio/activas")
    public Iterable<Agencia> getAgenciasActivas() {
        return agenciaRepository.findAllByActivaOrderByNombreAsc(true);
    }

    @GetMapping("/agenciasEnvio/{id}")
    public Agencia getAgenciaById(@PathVariable Long id) {
        return agenciaRepository.findById(id).orElse(null);
    }

    @GetMapping("/agenciasEnvio/nombre/{nombre}")
    public Agencia obtenerAgenciaPorNombre(@PathVariable String nombre) {
        return agenciaRepository.findByNombre(nombre).orElse(null);
    }

    @PostMapping("/agenciasEnvio")
    public Agencia addAgencia(@RequestBody Agencia agencia) {
        Agencia agenciaAux = agenciaRepository.findByNombre(agencia.getNombre()).orElse(null);

        if (agenciaAux != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La agencia ya existe");
        }

        return agenciaRepository.save(agencia);
    }   

    @PutMapping("/agenciasEnvio")
    public Agencia updateAgencia(@RequestBody Agencia agencia) {
        Agencia agenciaAux = agenciaRepository.findById(agencia.getId()).orElse(null);

        if (agenciaAux == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La agencia no existe");
        }

        return agenciaRepository.save(agencia);
    }

    @DeleteMapping("/agenciasEnvio/{id}")
    public void deleteAgencia(@PathVariable Long id) {
        Agencia agenciaAux = agenciaRepository.findById(id).orElse(null);

        if (agenciaAux == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La agencia no existe");
        }

        agenciaRepository.delete(agenciaAux);
    }

}