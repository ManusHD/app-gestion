package com.manushd.app.salidas.controllers;

import com.manushd.app.salidas.models.Salida;
import com.manushd.app.salidas.models.Producto;
import com.manushd.app.salidas.models.ProductoSalida;
import com.manushd.app.salidas.repository.SalidaRepository;

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
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Controller
@RestController
@CrossOrigin(value = "http://localhost:4200")
public class SalidaController {
    @Autowired
    private SalidaRepository salidasRepository;

    @GetMapping("/salidas")
    public Iterable<Salida> getSalidas() {
        return salidasRepository.findAll();
    }

    @GetMapping("/salidas/{id}")
    public Salida getSalidaById(@PathVariable Long id) {
        return salidasRepository.findById(id).orElse(null);
    }

    @GetMapping("/salidas/estado/{estado}")
    public Iterable<Salida> getSalidasByEstado(@PathVariable boolean estado) {
        return salidasRepository.findAllByEstado(estado);
    }

    @PostMapping("/salidas")
    public ResponseEntity<?> addSalida(@RequestBody Salida salida) {
        if (salida.getEstado()) {
            RestTemplate restTemplate = new RestTemplate();

            // Validar los productos
            for (ProductoSalida productoSalida : salida.getProductos()) {
                try {
                    // Obtener el producto por referencia
                    ResponseEntity<Producto> response = restTemplate.getForEntity(
                            "http://localhost:8091/productos/referencia/" + productoSalida.getRef(),
                            Producto.class);

                    Producto producto = response.getBody();

                    // Validar que existan suficientes unidades en el stock
                    if (producto.getStock() < productoSalida.getUnidades()) {
                        throw new IllegalArgumentException("Stock insuficiente para el producto con referencia: "
                                + productoSalida.getRef());
                    } else if (producto.getStock() == 0) {
                        throw new IllegalArgumentException("El producto con referencia: "
                                + productoSalida.getRef() + " tiene 0 unidades en Stock");
                    } else if (productoSalida.getUnidades() < 0) {
                        throw new IllegalArgumentException("Los productos no pueden tener unidades negativas"
                                + productoSalida.getRef());
                    } else if (producto == null) {
                        throw new IllegalArgumentException("No existe ningún producto con referencia: "
                                + productoSalida.getRef());
                    }

                } catch (HttpClientErrorException.NotFound e) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("El producto con referencia " + productoSalida.getRef() + " no existe.");
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(e.getMessage());
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("Error al procesar la salida: " + e.getMessage());
                }
            }
        }

        // Crear la salida y actualizar stock
        Salida savedSalida = salidasRepository.save(salida);

        if (salida.getEstado()) {
            actualizarStockProductos(salida.getProductos());
        }

        return ResponseEntity.ok(savedSalida);
    }

    private void actualizarStockProductos(Iterable<ProductoSalida> productos) {
        RestTemplate restTemplate = new RestTemplate();
        for (ProductoSalida productoSalida : productos) {
            try {
                String url = "http://localhost:8091/productos/" + productoSalida.getRef() + "/restar";
                restTemplate.exchange(
                        url,
                        HttpMethod.PUT,
                        new HttpEntity<>(productoSalida.getUnidades()),
                        ProductoSalida.class,
                        productoSalida.getRef());
            } catch (Exception e) {
                throw new RuntimeException(
                        "Error al actualizar stock del producto " + productoSalida.getRef() + ": " + e.getMessage());
            }
        }
    }

    @PutMapping("/salidas/{id}")
    public Salida updateSalida(@PathVariable Long id, @RequestBody Salida salida) {
        Salida salidaAux = salidasRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Salida no encontrada"));
        if (salidaAux != null) {
            return salidasRepository.save(salida);
        }

        return null;
    }

    @PutMapping("/salidas/{id}/enviar")
    public ResponseEntity<?> setEnviada(@PathVariable Long id) {
        Salida salidaAux = salidasRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Salida no encontrada"));
        if (salidaAux != null) {
            salidaAux.setEstado(true);
            return addSalida(salidaAux);
        }

        return null;
    }

    @DeleteMapping("/salidas/{id}")
    public void deleteById(@PathVariable Long id) {
        salidasRepository.deleteById(id);
    }
}
