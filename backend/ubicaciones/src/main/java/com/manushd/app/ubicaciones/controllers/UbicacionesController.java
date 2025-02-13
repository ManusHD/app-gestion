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
import com.manushd.app.ubicaciones.models.Producto;
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

    /**
     * Al sumar productos a una ubicación, se:
     * - Para productos normales: se comprueba si ya existe en la ubicación y se suman las unidades.
     * - Para productos especiales ("VISUAL" o "SIN REFERENCIA"): se añade una nueva entrada y se crea un nuevo producto en el microservicio de Productos.
     */
    @PostMapping("/ubicaciones/sumar")
    public Ubicacion sumarUbicacion(@RequestBody Ubicacion ubicacion) {
        Ubicacion ubiAux = ubicacionesRepository.findByNombre(ubicacion.getNombre()).orElse(null);

        if (ubiAux != null) {
            // Procesar los productos entrantes
            for (ProductoUbicacion nuevoProducto : ubicacion.getProductos()) {
                if (esProductoEspecial(nuevoProducto)) {
                    System.out.println("----------------Producto especial nuevo----------------");
                    System.out.println(nuevoProducto);
                    // Siempre se añade como nueva entrada
                    Producto createdProducto = addProductoEspecial(nuevoProducto);
                    System.out.println("----------------Producto especial created----------------");
                    System.out.println(createdProducto);
                    // Guardamos el id del producto creado en el microservicio de Productos
                    nuevoProducto.setProductoId(createdProducto.getId());
                    ubiAux.getProductos().add(nuevoProducto);
                } else {
                    // Producto normal: sumar unidades si ya existe
                    ProductoUbicacion productoExistente = ubiAux.getProductos()
                            .stream()
                            .filter(p -> p.getRef().equals(nuevoProducto.getRef()))
                            .findFirst()
                            .orElse(null);

                    if (productoExistente != null) {
                        productoExistente.setUnidades(productoExistente.getUnidades() + nuevoProducto.getUnidades());
                    } else {
                        ubiAux.getProductos().add(nuevoProducto);
                    }
                }
            }
            
            // Actualizar stock en el microservicio de Productos para los productos normales
            for (ProductoUbicacion p : ubicacion.getProductos()){
                if (!esProductoEspecial(p)) {
                    sumarStockProductoNormal(p);
                }
                // Para productos especiales ya se creó el producto en el endpoint addProductoEspecial.
            }
            return ubicacionesRepository.save(ubiAux);
        } else {
            // Si la ubicación no existe, se procede de forma similar al crearla desde cero
            for (ProductoUbicacion nuevoProducto : ubicacion.getProductos()) {
                if (esProductoEspecial(nuevoProducto)) {
                    System.out.println("----------------Producto especial nuevo ELSE----------------");
                    System.out.println(nuevoProducto);
                    Producto createdProducto = addProductoEspecial(nuevoProducto);
                    System.out.println("----------------Producto especial created ELSE----------------");
                    System.out.println(createdProducto);
                    nuevoProducto.setProductoId(createdProducto.getId());
                }
            }
            for (ProductoUbicacion p : ubicacion.getProductos()){
                if (!esProductoEspecial(p)) {
                    sumarStockProductoNormal(p);
                }
            }
            return ubicacionesRepository.save(ubicacion);
        }
    }

    /**
     * Al restar productos de una ubicación:
     * - Para productos normales: se busca por referencia.
     * - Para productos especiales: se busca por el productoId (almacenado al crearse).
     * Además, si tras la resta:
     * - Los productos especiales quedan en 0 unidades, se eliminan de la ubicación.
     * - Los productos normales se actualizan a 0 (no se elimina su información).
     */
    @PostMapping("/ubicaciones/restar")
    public ResponseEntity<?> restarUbicacion(@RequestBody Ubicacion ubicacion) {
        try {
            Ubicacion ubiAux = ubicacionesRepository.findByNombre(ubicacion.getNombre()).orElse(null);

            if (ubiAux != null) {
                for (ProductoUbicacion prodRestar : ubicacion.getProductos()) {
                    if (esProductoEspecial(prodRestar)) {
                        // Buscar por productoId
                        ProductoUbicacion prodExistente = ubiAux.getProductos()
                                .stream()
                                .filter(p -> p.getProductoId() != null && p.getProductoId().equals(prodRestar.getProductoId()))
                                .findFirst()
                                .orElse(null);
                        if (prodExistente == null) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("No se encontró el producto especial con id " + prodRestar.getProductoId()
                                            + " en la ubicación " + ubicacion.getNombre());
                        }
                        if (prodExistente.getUnidades() - prodRestar.getUnidades() < 0) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("No hay unidades suficientes del producto especial con id " + prodRestar.getProductoId());
                        } else if (prodExistente.getUnidades() - prodRestar.getUnidades() == 0) {
                            // Se elimina el producto especial de la ubicación
                            ubiAux.getProductos().remove(prodExistente);
                        } else {
                            prodExistente.setUnidades(prodExistente.getUnidades() - prodRestar.getUnidades());
                        }
                    } else {
                        // Producto normal: buscar por referencia
                        ProductoUbicacion prodExistente = ubiAux.getProductos()
                                .stream()
                                .filter(p -> p.getRef().equals(prodRestar.getRef()))
                                .findFirst()
                                .orElse(null);
                        if (prodExistente != null) {
                            if (prodExistente.getUnidades() - prodRestar.getUnidades() < 0) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body("No hay unidades suficientes del producto con referencia " 
                                                + prodRestar.getRef() + " en la ubicación " + ubicacion.getNombre());
                            } else {
                                // Si el resultado es 0, se actualiza el valor a 0 sin eliminar el producto
                                prodExistente.setUnidades(prodExistente.getUnidades() - prodRestar.getUnidades());
                            }
                        } else {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("No hay unidades del producto con referencia " + prodRestar.getRef()
                                            + " en la ubicación " + ubicacion.getNombre());
                        }
                    }
                }
                
                // Actualizar stock en el microservicio de Productos
                for (ProductoUbicacion p : ubicacion.getProductos()){
                    if (esProductoEspecial(p)) {
                        restarStockProductoEspecial(p);
                    } else {
                        restarStockProductoNormal(p);
                    }
                }
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

    // ----- Métodos auxiliares en UbicacionesController -----

    private boolean esProductoEspecial(ProductoUbicacion pu) {
        if (pu.getRef() == null) return false;
        // Quitar espacios y pasar a mayúsculas
        String r = pu.getRef().replaceAll("\\s+", "").toUpperCase();
        return "VISUAL".equals(r) || "SINREFERENCIA".equals(r);
    }
    
    /**
     * Llama al endpoint del microservicio Productos para crear un producto especial.
     */
    private Producto addProductoEspecial(ProductoUbicacion productoUbicacion) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://localhost:8091/productos/especial";
        // Se construye un objeto Producto a partir de ProductoUbicacion
        Producto producto = new Producto();
        producto.setReferencia(productoUbicacion.getRef());
        producto.setDescription(productoUbicacion.getDescription());
        producto.setStock(productoUbicacion.getUnidades());
        ResponseEntity<Producto> response = restTemplate.postForEntity(url, producto, Producto.class);
        return response.getBody();
    }

    /**
     * Actualiza stock para productos normales (suma).
     */
    private void sumarStockProductoNormal(ProductoUbicacion productoUbicacion) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://localhost:8091/productos/" + productoUbicacion.getRef() + "/sumar";
        restTemplate.exchange(
                url,
                HttpMethod.PUT,
                new HttpEntity<>(productoUbicacion.getUnidades()),
                Producto.class
        );
    }

    /**
     * Actualiza stock para productos normales (resta).
     */
    private void restarStockProductoNormal(ProductoUbicacion productoUbicacion) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://localhost:8091/productos/" + productoUbicacion.getRef() + "/restar";
        restTemplate.exchange(
                url,
                HttpMethod.PUT,
                new HttpEntity<>(productoUbicacion.getUnidades()),
                Producto.class
        );
    }

    /**
     * Llama al endpoint de Productos para restar stock de un producto especial (usando el productoId).
     */
    private void restarStockProductoEspecial(ProductoUbicacion productoUbicacion) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://localhost:8091/productos/" + productoUbicacion.getProductoId() + "/restarEspecial";
        restTemplate.exchange(
                url,
                HttpMethod.PUT,
                new HttpEntity<>(productoUbicacion.getUnidades()),
                String.class
        );
    }    

    @PutMapping("/ubicaciones/{id}")
    public Ubicacion actualizarUbicacion(@PathVariable Long id, @RequestBody Ubicacion ubicacionDetails) {
        Ubicacion ubicacion = ubicacionesRepository.findById(id).orElse(null);
        if (ubicacion != null) {
            Ubicacion existeUbicacion = ubicacionesRepository.findByNombre(ubicacionDetails.getNombre()).orElse(null);
            if (existeUbicacion != null) {
                if (ubicacionDetails.getId() != existeUbicacion.getId() &&
                    ubicacionDetails.getNombre().equals(existeUbicacion.getNombre())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta ubicación ya existe");
                }
            }
            return ubicacionesRepository.save(ubicacionDetails);
        }
        return null;
    }

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
