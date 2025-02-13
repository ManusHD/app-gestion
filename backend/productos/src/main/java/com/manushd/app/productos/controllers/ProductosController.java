package com.manushd.app.productos.controllers;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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

import com.manushd.app.productos.models.Producto;
import com.manushd.app.productos.repository.ProductoRepository;

@Controller
@RestController
@CrossOrigin(value = "http://localhost:4200")
public class ProductosController {

    @Autowired
    private ProductoRepository productosRepository;

    @GetMapping("/productos")
    public Iterable<Producto> getProductos() {
        return productosRepository.findAll();
    }

    @GetMapping("/productos/byReferencia")
    public Iterable<Producto> getProductosOrderByReferencia() {
        return productosRepository.findAllByOrderByReferenciaAsc();
    }

    @GetMapping("/productos/{id}")
    public Producto getProductoById(@PathVariable Long id) {
        return productosRepository.findById(id).orElse(null);
    }

    @GetMapping("/productos/referencia/{referencia}")
    public Producto obtenerProductoPorReferencia(@PathVariable String referencia) {
        return productosRepository.findByReferencia(referencia).orElse(null);
    }

    @GetMapping("/productos/referencia/{referencia}/coincidentes")
    public Iterable<Producto> obtenerProductosPorReferencia(@PathVariable String referencia) {
        return productosRepository.findByReferenciaContainingIgnoreCaseOrderByReferenciaAsc(referencia);
    }

    @GetMapping("/productos/description/{description}")
    public Iterable<Producto> obtenerProductosPorDescripcion(@PathVariable String description) {
        return productosRepository.findByDescriptionContainingIgnoreCase(description);
    }

    @GetMapping("/productos/sinreferencia")
    public Iterable<Producto> obtenerProductosSinReferencia() {
        return productosRepository.findByReferenciaContainingIgnoreCase("SIN REFERENCIA");
    }

    @GetMapping("/productos/sinreferencia/{id}")
    public Producto obtenerProductosSinReferenciaPorId(@PathVariable Long id) {
        Producto p = productosRepository.findById(id).orElse(null);
        if (p != null && "SIN REFERENCIA".equalsIgnoreCase(p.getReferencia())) {
            return p;
        }
        return null;
    }

    @GetMapping("/productos/sinreferencia/descripcion/{description}")
    public Iterable<Producto> obtenerProductosSinReferenciaPorDescripcion(@PathVariable String description) {
        return productosRepository.findByReferenciaAndDescriptionContainingIgnoreCase("SIN REFERENCIA", description);
    }

    @GetMapping("/productos/visuales")
    public Iterable<Producto> obtenerVisuales() {
        return productosRepository.findByReferenciaContainingIgnoreCase("VISUAL");
    }

    @GetMapping("/productos/visual/{id}")
    public Producto obtenerVisualesPorId(@PathVariable Long id) {
        Producto p = productosRepository.findById(id).orElse(null);
        if (p != null && "VISUAL".equalsIgnoreCase(p.getReferencia())) {
            return p;
        }
        return null;
    }

    @GetMapping("/productos/visuales/descripcion/{description}")
    public Iterable<Producto> obtenerVisualesPorDescripcion(@PathVariable String description) {
        return productosRepository.findByReferenciaAndDescriptionContainingIgnoreCase("VISUAL", description);
    }

    /**
     * Endpoint para crear un producto normal.
     * Se mantiene la lógica existente.
     */
    @PostMapping("/productos")
    public Producto addProducto(@RequestBody Producto producto) {
        Producto aux = productosRepository.findByReferencia(producto.getReferencia()).orElse(null);
        if (aux == null) {
            return productosRepository.save(producto);
        }
        return null;
    }

    /**
     * Endpoint para modificar la descripción de un producto normal.
     */
    @PutMapping("/productos/{id}")
    public Producto modifyDescription(@PathVariable Long id, @RequestBody String description) {
        Producto producto = productosRepository.findById(id).orElse(null);
        if (producto != null) {
            producto.setDescription(description);
            return productosRepository.save(producto);
        }
        return null;
    }

    /**
     * Endpoint para sumar stock a un producto normal.
     */
    @PutMapping("/productos/{ref}/sumar")
    public Producto addStock(@PathVariable String ref, @RequestBody Integer cantidad) {
        Producto producto = productosRepository.findByReferencia(ref).orElse(null);
        if (producto != null) {
            Integer nuevoStock = producto.getStock() + cantidad;
            producto.setStock(nuevoStock);
            return productosRepository.save(producto);
        } else {
            System.out.println("El producto con referencia: " + ref + " no existe");
        }
        return null;
    }

    /**
     * Endpoint para restar stock a un producto normal.
     */
    @PutMapping("/productos/{ref}/restar")
    public Producto subtractStock(@PathVariable String ref, @RequestBody Integer cantidad) {
        Producto producto = productosRepository.findByReferencia(ref).orElse(null);
        if (producto != null) {
            Integer nuevoStock = producto.getStock() - cantidad;
            if (nuevoStock >= 0) {
                producto.setStock(nuevoStock);
                return productosRepository.save(producto);
            }
            return null;
        }
        return null;
    }

    /**
     * Endpoint para crear un producto especial (con referencia "VISUAL" o "SIN
     * REFERENCIA")
     * sin comprobar si ya existe.
     */
    @PostMapping("/productos/especial")
    public Producto addProductoEspecial(@RequestBody Producto producto) {
        // Se asume que en el objeto producto ya se establecen:
        // - referencia ("VISUAL" o "SIN REFERENCIA")
        // - description
        // - stock (cantidad recibida)
        Producto productoFinal = productosRepository.save(producto);
        productoFinal.setProductoId(productoFinal.getId());
        productoFinal = productosRepository.save(productoFinal);
        System.out.println("Producto guardado:");
        System.out.println(productoFinal);
        return productoFinal;
    }

    /**
     * Endpoint para restar stock a un producto especial, identificado por su id.
     * Si tras restar el stock este queda en 0, se elimina el producto.
     */
    @PutMapping("/productos/{id}/restarEspecial")
    public ResponseEntity<?> subtractStockEspecial(@PathVariable Long id, @RequestBody Integer cantidad) {
        Optional<Producto> optProducto = productosRepository.findById(id);
        if (!optProducto.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Producto especial con id " + id + " no encontrado");
        }
        Producto producto = optProducto.get();
        int nuevoStock = producto.getStock() - cantidad;
        if (nuevoStock < 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("No hay stock suficiente para el producto especial con id " + id);
        } else if (nuevoStock == 0) {
            productosRepository.delete(producto);
            return ResponseEntity.ok("Producto especial con id " + id + " eliminado por stock 0");
        } else {
            producto.setStock(nuevoStock);
            productosRepository.save(producto);
            return ResponseEntity.ok(producto);
        }
    }

    @DeleteMapping("/productos/{id}")
    public void deleteById(@PathVariable Long id) {
        productosRepository.deleteById(id);
    }
}
