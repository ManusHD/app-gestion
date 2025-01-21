package com.manushd.app.ubicaciones.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.client.RestTemplate;

import com.manushd.app.ubicaciones.models.Ubicacion;
import com.manushd.app.ubicaciones.models.ProductoUbicacion;
import com.manushd.app.ubicaciones.models.ProductoEntrada;
import com.manushd.app.ubicaciones.repository.UbicacionesRepository;

@Controller
@RestController
@CrossOrigin(value = "http://localhost:4200")
public class UbicacionesController {
    @Autowired
    private UbicacionesRepository ubicacionesRepository;

    @GetMapping("/ubicaciones")
    public Iterable<Ubicacion> getUbicaciones() {
        return ubicacionesRepository.findAll();
    }

    @GetMapping("/ubicaciones/byNombre")
    public Iterable<Ubicacion> getUbicacionesOrderByNombre() {
        return ubicacionesRepository.findAllByOrderByNombreAsc();
    }

    @GetMapping("/ubicaciones/{id}")
    public Ubicacion getUbicacionById(@PathVariable Long id) {
        return ubicacionesRepository.findById(id).orElse(null);
    }

    @PostMapping("/ubicaciones")
    public Ubicacion addUbicacion(@RequestBody Ubicacion ubicacion) {
        Ubicacion ubiAux = ubicacionesRepository.findByNombre(ubicacion.getNombre()).orElse(null);

        if (ubiAux != null) {
            throw new IllegalArgumentException("La ubicación ya existe");
        } else if (ubicacion.getNombre().isEmpty() || ubicacion.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre de la ubicación no puede estar vacío");
        }

        return ubicacionesRepository.save(ubicacion);
    }

    @GetMapping("/ubicaciones/nombre/{nombre}")
    public Ubicacion obtenerUbicacionPorNombre(@PathVariable String nombre) {
        return ubicacionesRepository.findByNombre(nombre).orElse(null);
    }

    @GetMapping("/ubicaciones/nombre/{nombre}/coincidentes")
    public Iterable<Ubicacion> obtenerUbicacionesPorNombre(@PathVariable String nombre) {
        return ubicacionesRepository.findByNombreContainingIgnoreCaseOrderByNombreAsc(nombre);
    }

    @GetMapping("/ubicaciones/referenciaProducto/{ref}")
    public Iterable<Ubicacion> findByProductosRef(@PathVariable String ref) {
        return ubicacionesRepository.findByProductosRefOrderByNombreAsc(ref);
    }

    @PostMapping("/ubicaciones/sumar")
    public Ubicacion sumarUbicacion(@RequestBody Ubicacion ubicacion) {
        Ubicacion ubiAux = ubicacionesRepository.findByNombre(ubicacion.getNombre()).orElse(null);

        if (ubiAux != null) {
            // Procesar los productos de la ubicación entrante
            for (ProductoUbicacion nuevoProducto : ubicacion.getProductos()) {
                // Buscar si el producto ya existe en la ubicación actual
                ProductoUbicacion productoExistente = ubiAux.getProductos()
                        .stream()
                        .filter(p -> p.getRef().equals(nuevoProducto.getRef()))
                        .findFirst()
                        .orElse(null);

                if (productoExistente != null) {
                    // Si el producto existe, sumar las unidades
                    productoExistente.setUnidades(productoExistente.getUnidades() + nuevoProducto.getUnidades());
                } else {
                    // Si no existe, añadir el producto a la ubicación
                    ubiAux.getProductos().add(nuevoProducto);
                }
            }
            // Guardar la ubicación actualizada
            sumarStockProductos(ubicacion.getProductos());
            return ubicacionesRepository.save(ubiAux);
        } else {
            // Si la ubicación no existe, guardarla directamente
            sumarStockProductos(ubicacion.getProductos());
            return ubicacionesRepository.save(ubicacion);
        }
    }

    private void sumarStockProductos(Iterable<ProductoUbicacion> productos) {
        RestTemplate restTemplate = new RestTemplate();
        for (ProductoUbicacion productoUbicacion : productos) {
            try {
                String url = "http://localhost:8091/productos/" + productoUbicacion.getRef() + "/sumar";
                restTemplate.exchange(
                        url,
                        HttpMethod.PUT,
                        new HttpEntity<>(productoUbicacion.getUnidades()),
                        ProductoUbicacion.class,
                        productoUbicacion.getRef());
            } catch (Exception e) {
                throw new RuntimeException(
                        "Error al actualizar stock del producto " + productoUbicacion.getRef() + ": " + e.getMessage());
            }
        }
    }

    @PostMapping("/ubicaciones/restar")
    public ResponseEntity<?> restarUbicacion(@RequestBody Ubicacion ubicacion) {
        try {
            Ubicacion ubiAux = ubicacionesRepository.findByNombre(ubicacion.getNombre()).orElse(null);

            if (ubiAux != null) {
                for (ProductoUbicacion nuevoProducto : ubicacion.getProductos()) {
                    ProductoUbicacion productoExistente = ubiAux.getProductos()
                            .stream()
                            .filter(p -> p.getRef().equals(nuevoProducto.getRef()))
                            .findFirst()
                            .orElse(null);

                    if (productoExistente != null) {
                        if (productoExistente.getUnidades() - nuevoProducto.getUnidades() < 0) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("No hay unidades suficientes del producto con referencia "
                                            + nuevoProducto.getRef() + " en la ubicación " + ubicacion.getNombre());
                        } else if (productoExistente.getUnidades() - nuevoProducto.getUnidades() == 0) {
                            ubiAux.getProductos().remove(productoExistente);
                        } else {
                            productoExistente
                                    .setUnidades(productoExistente.getUnidades() - nuevoProducto.getUnidades());
                        }
                    } else {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("No hay unidades del producto con referencia " + nuevoProducto.getRef()
                                        + " en la ubicación " + ubicacion.getNombre());
                    }
                }

                restarStockProductos(ubicacion.getProductos());
                return ResponseEntity.ok(ubicacionesRepository.save(ubiAux));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("No existe la ubicación: " + ubicacion.getNombre());
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al procesar la solicitud: " + e.getMessage());
        }
    }

    private void restarStockProductos(Iterable<ProductoUbicacion> productos) {
        RestTemplate restTemplate = new RestTemplate();
        for (ProductoUbicacion productoUbicacion : productos) {
            try {
                String url = "http://localhost:8091/productos/" + productoUbicacion.getRef() + "/restar";
                restTemplate.exchange(
                        url,
                        HttpMethod.PUT,
                        new HttpEntity<>(productoUbicacion.getUnidades()),
                        ProductoUbicacion.class,
                        productoUbicacion.getRef());
            } catch (Exception e) {
                throw new RuntimeException(
                        "Error al actualizar stock del producto " + productoUbicacion.getRef() + ": " + e.getMessage());
            }
        }

    }

    // @PutMapping("/ubicaciones/{id}")
    // public Ubicacion actualizarUbicacion(@RequestBody Ubicacion ubicacion) {
    // return ubicacionesRepository.save(ubicacion);
    // }

    @DeleteMapping("/ubicaciones/{id}")
    public ResponseEntity<?> deleteById(@PathVariable Long id) {
        Ubicacion ubicacionAux = ubicacionesRepository.findById(id).orElse(null);
        if (ubicacionAux == null) {
            return ResponseEntity.badRequest().body("ERROR: La ubicación no existe");
        } else if (ubicacionAux.getProductos().size() > 0) {
            return ResponseEntity.badRequest()
                    .body("ERROR: La ubicación " + ubicacionAux.getNombre() + " tiene productos asociados");
        } else {
            ubicacionesRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
    }
}
