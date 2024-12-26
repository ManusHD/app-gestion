package com.manushd.app.entradas.controllers;

import com.manushd.app.entradas.models.Entrada;
import com.manushd.app.entradas.models.Producto;
import com.manushd.app.entradas.models.ProductoEntrada;
import com.manushd.app.entradas.repository.EntradaRepository;

import java.util.ArrayList;

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
import org.springframework.http.ResponseEntity;

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
public ResponseEntity<?> addEntrada(@RequestBody Entrada entrada) {
    if (entrada.getEstado()) {
        RestTemplate restTemplate = new RestTemplate();
        
        // Verificar y crear productos si no existen
        for (ProductoEntrada productoEntrada : entrada.getProductos()) {
            try {
                // Intentar obtener el producto
                ResponseEntity<Producto> response = restTemplate.getForEntity(
                    "http://localhost:8091/productos/referencia/" + productoEntrada.getRef(),
                    Producto.class
                );
                
                if (response.getBody() == null) {
                    // Si no existe, crear el producto
                    Producto nuevoProducto = new Producto();
                    nuevoProducto.setReferencia(productoEntrada.getRef());
                    nuevoProducto.setDescription(productoEntrada.getDescription());
                    nuevoProducto.setStock(0); // Stock inicial en 0
                    
                    // Llamar al endpoint para crear el producto
                    restTemplate.postForEntity(
                        "http://localhost:8091/productos",
                        nuevoProducto,
                        Producto.class
                    );
                }
            } catch (Exception e) {
                throw new RuntimeException("Error al verificar/crear el producto " + productoEntrada.getRef() + ": " + e.getMessage());
            }
        }
    }
    
    // Crear la entrada y actualizar stock
    Entrada savedEntrada = entradasRepository.save(entrada);
    
    if (entrada.getEstado()) {
        actualizarStockProductos(entrada.getProductos());
    }
    
    return ResponseEntity.ok(savedEntrada);
}

private void actualizarStockProductos(Iterable<ProductoEntrada> productos) {
    RestTemplate restTemplate = new RestTemplate();
    for (ProductoEntrada productoEntrada : productos) {
        try {
            String url = "http://localhost:8091/productos/" + productoEntrada.getRef() + "/sumar";
            restTemplate.exchange(
                url,
                HttpMethod.PUT,
                new HttpEntity<>(productoEntrada.getUnidades()),
                ProductoEntrada.class,
                productoEntrada.getRef()
            );
        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar stock del producto " + productoEntrada.getRef() + ": " + e.getMessage());
        }
    }
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
    public ResponseEntity<?> setRecibida(@PathVariable Long id) {
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
