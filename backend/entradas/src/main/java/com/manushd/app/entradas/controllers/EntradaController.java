package com.manushd.app.entradas.controllers;

import com.manushd.app.entradas.models.Entrada;
import com.manushd.app.entradas.models.ProductoEntrada;
import com.manushd.app.entradas.repository.EntradaRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
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

    @GetMapping("/entradas/estado/{estado}")
    public Iterable<Entrada> getEntradasByEstado(@PathVariable boolean estado) {
        return entradasRepository.findAllByEstado(estado);
    }

    @PostMapping("/entradas")
    public Entrada addEntrada(@RequestBody Entrada entrada) {
        Entrada savedEntrada = entradasRepository.save(entrada);

        if (entrada.getEstado()) {
            for (ProductoEntrada productoEntrada : entrada.getProductos()) {
                try {
                    // Realizar la llamada al endpoint de productos para sumar stock
                    RestTemplate restTemplate = new RestTemplate();
                    String url = "http://localhost:8091/productos/" + productoEntrada.getRef() + "/sumar";
                    System.out.println("Se ha llamado al end-point");
                    System.out.println(url);

                    restTemplate.exchange(
                            url,
                            HttpMethod.PUT,
                            new HttpEntity<>(productoEntrada.getUnidades()),
                            ProductoEntrada.class,
                            productoEntrada.getRef());
                } catch (Exception e) {
                    System.err.println("Error al actualizar stock del producto: " + e.getMessage());
                }
            }
        }

        return savedEntrada;
    }
    
    @PutMapping("/entradas/{id}")
    public Entrada setRecibida(@PathVariable Long id, @RequestBody Entrada entrada) {
        Entrada entradaAux = entradasRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));
        if (entradaAux != null) {
            return entradasRepository.save(entrada);
        }

        return null;
    }

    @PutMapping("/entradas/{id}/recibir")
    public Entrada setRecibida(@PathVariable Long id) {
        Entrada entradaAux = entradasRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));
        if (entradaAux != null) {
            entradaAux.setEstado(true);
            return addEntrada(entradaAux);
        }

        return null;
    }

    @DeleteMapping("/entradas/{id}")
    public void deleteById(@PathVariable Long id) {
        entradasRepository.deleteById(id);
    }
}
