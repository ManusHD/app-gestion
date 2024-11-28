package com.manushd.app.entradas.controllers;

import com.manushd.app.entradas.models.Entrada;
import com.manushd.app.entradas.repository.EntradaRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Controller
@RestController
@CrossOrigin(value = "http://localhost:4200")
public class EntradaController {
    @Autowired
    private EntradaRepository entradasRepository;

    @GetMapping("/entradas")
    public Iterable<Entrada> getEntradas() {
        return entradasRepository.findAll();
    }
    
    @GetMapping("/entradas/{id}")
    public Entrada getEntradaById(@PathVariable Long id) {
        return entradasRepository.findById(id).orElse(null);
    }

    @PostMapping("/entradas")
    public Entrada addEntrada(@RequestBody Entrada entrada) {
        return entradasRepository.save(entrada);
    }
    
    @PutMapping("/entradas/{id}/recibir")
    public Entrada setRecibida(@PathVariable Long id) {
        return entradasRepository.findById(id).map(entradaAux -> {
            entradaAux.setEstado(true);
            return entradasRepository.save(entradaAux);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));
    }
    
    @PutMapping("/entradas/{id}")
    public Entrada setRecibida(@PathVariable Long id, @RequestBody Entrada entrada) {
        Entrada entradaAux = entradasRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));
        if (entradaAux != null) {
            return entradasRepository.save(entrada);
        }

        return null;
    }

    @DeleteMapping("/entradas/{id}")
    public void deleteById(@PathVariable Long id) {
        entradasRepository.deleteById(id);
    }
}
