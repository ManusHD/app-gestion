package com.manushd.app.ubicaciones.controllers;

import org.springframework.beans.factory.annotation.Autowired;
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

import com.manushd.app.ubicaciones.models.Ubicacion;
import com.manushd.app.ubicaciones.models.ProductoUbicacion;
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

    @GetMapping("/ubicaciones/nombre/{nombre}")
    public Ubicacion obtenerUbicacionPorNombre(@PathVariable String nombre) {
        return ubicacionesRepository.findByNombre(nombre).orElse(null);
    }

    @PostMapping("/ubicaciones/sumar")
    public Ubicacion addUbicacion(@RequestBody Ubicacion ubicacion) {
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
            return ubicacionesRepository.save(ubiAux);
        } else {
            // Si la ubicación no existe, guardarla directamente
            return ubicacionesRepository.save(ubicacion);
        }
    }

    @PostMapping("/ubicaciones/restar")
    public Ubicacion restarUbicacion(@RequestBody Ubicacion ubicacion) {
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
                    // Si el producto existe, restar las unidades
                    productoExistente.setUnidades(productoExistente.getUnidades() - nuevoProducto.getUnidades());
                } else {
                    // Si no existe el producto
                    throw new IllegalArgumentException("No hay unidades del producto con referencia " + nuevoProducto.getRef() + " en la ubicación indicada");
                }
            }
            // Guardar la ubicación actualizada
            return ubicacionesRepository.save(ubiAux);
        } else {
            throw new IllegalArgumentException("No existe la ubicación: " + ubicacion.getNombre());
        }
    }

    // @PutMapping("/ubicaciones/{id}")
    // public Ubicacion actualizarUbicacion(@RequestBody Ubicacion ubicacion) {
    //     return ubicacionesRepository.save(ubicacion);
    // }

    @DeleteMapping("/ubicaciones/{id}")
    public void deleteById(@PathVariable Long id) {
        ubicacionesRepository.deleteById(id);
    }
}
