package com.manushd.app.productos.controllers;

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
        return productosRepository.findByReferenciaContainingIgnoreCase(referencia);
    }

    @GetMapping("/productos/description/{description}")
    public Iterable<Producto> obtenerProductosPorDescripcion(@PathVariable String description) {
        return productosRepository.findByDescriptionContainingIgnoreCase(description);
    }

    @PostMapping("/productos")
    public Producto addProducto(@RequestBody Producto producto) {
        Producto aux = productosRepository.findByReferencia(producto.getReferencia()).orElse(null);
        if(aux == null) {
            return productosRepository.save(producto);
        }
        return null;
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
    
    @PutMapping("/productos/{ref}/sumar")
    public Producto addStock(@PathVariable String ref, @RequestBody Integer cantidad) {
        Producto producto = productosRepository.findByReferencia(ref).orElse(null);
        if (producto != null) {
            Integer nuevoStock = producto.getStock() + cantidad;
            producto.setStock(nuevoStock);
            return productosRepository.save(producto);
        }else{
            System.out.println("El producto con referencia: " + ref + " no existe");
        }

        return null;
    }
    
    @PutMapping("/productos/{ref}/restar")
    public Producto subtractStock(@PathVariable String ref, @RequestBody Integer cantidad) {
        Producto producto = productosRepository.findByReferencia(ref).orElse(null);
        if (producto != null) {
            Integer nuevoStock = producto.getStock() - cantidad;
            if(nuevoStock >= 0) {
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
