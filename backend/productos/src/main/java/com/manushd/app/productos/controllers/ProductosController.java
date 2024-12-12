package com.manushd.app.productos.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.manushd.app.productos.models.Producto;
import com.manushd.app.productos.repository.ProductoRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;


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
    
    @GetMapping("/productos/{id}")
    public Producto getProductoById(@PathVariable Long id) {
        return productosRepository.findById(id).orElse(null);
    }

    @GetMapping("/productos/referencia/{referencia}")
    public Producto obtenerProductoPorReferencia(@PathVariable String referencia) {
        return productosRepository.findByReferencia(referencia).orElse(null);
    }

    @PostMapping("/productos")
    public Producto addProducto(@RequestBody Producto producto) {
        return productosRepository.save(producto);
    }
    
    @PutMapping("/productos/{id}")
    public Producto modifyDescription(@PathVariable Long id, @RequestBody String description) {
        Producto producto = productosRepository.findById(id).orElse(null);
        if (producto != null) {
            producto.setDescription(description);
            return productosRepository.save(producto);
        }

        return null;
    }
    
    @PutMapping("/productos/{id}/sumar")
    public Producto addStock(@PathVariable Long id, @RequestBody Integer cantidad) {
        Producto producto = productosRepository.findById(id).orElse(null);
        if (producto != null) {
            Integer nuevoStock = producto.getStock() + cantidad;
            producto.setStock(nuevoStock);
            return productosRepository.save(producto);
        }

        return null;
    }
    
    @PutMapping("/productos/{id}/restar")
    public Producto subtractStock(@PathVariable Long id, @RequestBody Integer cantidad) {
        Producto producto = productosRepository.findById(id).orElse(null);
        if (producto != null) {
            Integer nuevoStock = producto.getStock() - cantidad;
            if(nuevoStock > 0) {
                producto.setStock(nuevoStock);
                return productosRepository.save(producto);
            }
            return null;
        }

        return null;
    }

    @DeleteMapping("/productos/{id}")
    public void deleteById(@PathVariable Long id) {
        productosRepository.deleteById(id);
    }


}
