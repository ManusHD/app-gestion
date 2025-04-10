package com.manushd.app.productos.controllers;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;

import com.manushd.app.productos.models.Producto;
import com.manushd.app.productos.models.ProductoDescripcionUpdateDTO;
import com.manushd.app.productos.repository.ProductoRepository;
import org.springframework.security.access.prepost.PreAuthorize;

@Controller
@RestController
@RequestMapping("/productos")
@PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
public class ProductosController {

    @Autowired
    private ProductoRepository productosRepository;

    @GetMapping("")
    public Iterable<Producto> getProductos() {
        return productosRepository.findAllByOrderByReferenciaAsc();
    }

    @GetMapping("/byReferencia")
    public Page<Producto> getProductosOrdenados(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return productosRepository.findAllByOrderByReferenciaAsc(
                PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public Producto getProductoById(@PathVariable Long id) {
        return productosRepository.findById(id).orElse(null);
    }

    @GetMapping("/referencia/{referencia}")
    public Producto obtenerProductoPorReferencia(@PathVariable String referencia) {
        return productosRepository.findByReferencia(referencia).orElse(null);
    }

    @GetMapping("/referencia/{referencia}/buscar/paginado")
    public Page<Producto> getProductosByReferenciaContainingPaginado(
            @PathVariable String referencia,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return productosRepository.findByReferenciaContainingIgnoreCaseOrderByReferenciaAsc(
                referencia, PageRequest.of(page, size));
    }

    @GetMapping("/referencia/{referencia}/buscar")
    public Iterable<Producto> getProductosByReferenciaContaining(
            @PathVariable String referencia) {
        return productosRepository.findByReferenciaContainingIgnoreCaseOrderByReferenciaAsc(
                referencia);
    }

    @GetMapping("/description/{description}/paginado")
    public Page<Producto> getProductosByDescriptionContainingPaginado(
            @PathVariable String description,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return productosRepository.findByDescriptionContainingIgnoreCaseOrderByDescriptionAsc(
                description, PageRequest.of(page, size));
    }

    @GetMapping("/description/{description}")
    public Iterable<Producto> getProductosByDescriptionContaining(
            @PathVariable String description) {
        return productosRepository.findByDescriptionContainingIgnoreCaseOrderByDescriptionAsc(
                description);
    }

    @GetMapping("/sinreferencia")
    public Page<Producto> obtenerProductosSinReferencia(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return productosRepository.findByReferenciaContainingIgnoreCaseOrderByDescriptionAsc(
                "SIN REFERENCIA", PageRequest.of(page, size));
    }

    @GetMapping("/sinreferencia/{id}")
    public Producto obtenerProductosSinReferenciaPorId(@PathVariable Long id) {
        Producto p = productosRepository.findById(id).orElse(null);
        if (p != null && "SIN REFERENCIA".equalsIgnoreCase(p.getReferencia())) {
            return p;
        }
        return null;
    }

    @GetMapping("/sinreferencia/descripcion/{description}")
    public Page<Producto> obtenerProductosSinReferenciaPorDescripcion(
            @PathVariable String description,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return productosRepository.findByReferenciaAndDescriptionContainingIgnoreCaseOrderByDescriptionAsc(
                "SIN REFERENCIA", description, PageRequest.of(page, size));
    }

    @GetMapping("/visuales")
    public Page<Producto> obtenerVisuales(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return productosRepository.findByReferenciaContainingIgnoreCaseOrderByDescriptionAsc(
                "VISUAL", PageRequest.of(page, size));
    }

    @GetMapping("/visual/{id}")
    public Producto obtenerVisualesPorId(@PathVariable Long id) {
        Producto p = productosRepository.findById(id).orElse(null);
        if (p != null && "VISUAL".equalsIgnoreCase(p.getReferencia())) {
            return p;
        }
        return null;
    }

    @GetMapping("/visuales/descripcion/{description}")
    public Page<Producto> obtenerVisualesPorDescripcion(
            @PathVariable String description,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return productosRepository.findByReferenciaAndDescriptionContainingIgnoreCaseOrderByDescriptionAsc("VISUAL",
                description, PageRequest.of(page, size));
    }

    /**
     * Endpoint para crear un producto normal.
     * Se mantiene la lógica existente.
     */
    @PostMapping("")
    public Producto addProducto(@RequestBody Producto producto) {
        Producto aux = productosRepository.findByReferencia(producto.getReferencia()).orElse(null);
        if (aux != null) {
            throw new IllegalArgumentException("Ya existe un producto con la misma referencia");
        } else if (producto.getReferencia() == null || producto.getDescription() == null
                || producto.getReferencia().length() < 1 || producto.getDescription().length() < 1) {
            throw new IllegalArgumentException("La referencia y descripción no pueden estar vacíos");
        }
        producto.setReferencia(producto.getReferencia().trim());
        return productosRepository.save(producto);
    }

    /**
     * Endpoint para modificar la descripción de un producto.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> modifyDescription(
            @PathVariable Long id,
            @RequestBody String newDescription,
            @RequestHeader("Authorization") String token) {
        // Buscar el producto en la base de datos
        Producto producto = productosRepository.findById(id).orElse(null);
        if (producto == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Producto no encontrado");
        }
        String oldDescription = producto.getDescription();

        // Construir el DTO para actualizar en UBICACIONES
        ProductoDescripcionUpdateDTO dto = new ProductoDescripcionUpdateDTO();
        dto.setRef(producto.getReferencia()); // Se asume que la propiedad se llama "referencia"
        dto.setOldDescription(oldDescription);
        dto.setNewDescription(newDescription);

        // Configurar el RestTemplate y los headers incluyendo el token
        RestTemplate restTemplate = new RestTemplate();
        String ubicacionesUrl = "http://localhost:8095/ubicaciones/productos/updateDescripcion";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        HttpEntity<ProductoDescripcionUpdateDTO> requestEntity = new HttpEntity<>(dto, headers);

        // Invocar al endpoint del microservicio de UBICACIONES
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    ubicacionesUrl,
                    HttpMethod.PUT,
                    requestEntity,
                    String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error al actualizar ubicaciones: " + response.getBody());
            }
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al actualizar ubicaciones: " + ex.getMessage());
        }

        // Si la llamada a UBICACIONES fue exitosa, se actualiza el producto en
        // PRODUCTOS
        producto.setDescription(newDescription);
        Producto updatedProducto = productosRepository.save(producto);
        return ResponseEntity.ok(updatedProducto);
    }

    /**
     * Endpoint para sumar stock a un producto normal.
     */
    @PutMapping("/{ref}/sumar")
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
    @PutMapping("/{ref}/restar")
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
    @PostMapping("/especial")
    public Producto addProductoEspecial(@RequestBody Producto producto) {
        // Se asume que en el objeto producto ya se establecen:
        // - referencia ("VISUAL" o "SIN REFERENCIA")
        // - description
        // - stock (cantidad recibida)

        // Comprueba que no exista un producto con la misma descripción
        Optional<Producto> existe = productosRepository.findByReferenciaAndDescription(producto.getReferencia(),
                producto.getDescription());

        Producto productoFinal = null;

        if (!producto.getReferencia().equals("VISUAL") && !producto.getReferencia().equals("SIN REFERENCIA")) {
            throw new IllegalArgumentException(
                    "La referencia de un producto especial debe ser 'VISUAL' o 'SIN REFERENCIA'");
        }

        if (existe.isPresent() && producto.getReferencia().equals("VISUAL")) {
            throw new IllegalArgumentException("Ya existe un visual con Descripción: " + producto.getDescription());
        } else if (existe.isPresent() && producto.getReferencia().equals("SIN REFERENCIA")) {
            Integer nuevoStock = producto.getStock() + existe.get().getStock();
            existe.get().setStock(nuevoStock);

            existe.get().setDescription(existe.get().getDescription().trim());
            productoFinal = productosRepository.save(existe.get());
        } else {
            producto.setDescription(producto.getDescription().trim());
            productoFinal = productosRepository.save(producto);
        }

        productoFinal = productosRepository.save(productoFinal);
        return productoFinal;
    }

    /**
     * Endpoint para restar stock a un producto especial, identificado por su id.
     * Si tras restar el stock este queda en 0, se elimina el producto.
     */
    @PutMapping("/visual/restarEspecial/{description}")
    public ResponseEntity<?> subtractStockEspecialVisual(@PathVariable String description,
            @RequestBody Integer cantidad) {
        Optional<Producto> optProducto = productosRepository.findByReferenciaAndDescription("VISUAL", description);
        if (!optProducto.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Producto especial con Descripción '" + optProducto.get().getDescription()
                            + "' no encontrado");
        }
        Producto producto = optProducto.get();
        int nuevoStock = producto.getStock() - cantidad;
        if (nuevoStock < 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("No hay stock suficiente para el producto especial con Descripción "
                            + optProducto.get().getDescription());
        } else if (nuevoStock == 0) {
            productosRepository.delete(producto);
            return ResponseEntity.ok("Producto especial con Descripción " + optProducto.get().getDescription()
                    + " eliminado por stock 0");
        } else {
            producto.setStock(nuevoStock);
            productosRepository.save(producto);
            return ResponseEntity.ok(producto);
        }
    }

    @PutMapping("/sinreferencia/restarEspecial/{description}")
    public ResponseEntity<?> subtractStockEspecialSR(@PathVariable String description, @RequestBody Integer cantidad) {
        Optional<Producto> optProducto = productosRepository.findByReferenciaAndDescription("SIN REFERENCIA",
                description);
        if (!optProducto.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Producto especial con Descripción '" + optProducto.get().getDescription()
                            + "' no encontrado");
        }
        Producto producto = optProducto.get();
        int nuevoStock = producto.getStock() - cantidad;
        if (nuevoStock < 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("No hay stock suficiente para el producto especial con Descripción "
                            + optProducto.get().getDescription());
        } else if (nuevoStock == 0) {
            productosRepository.delete(producto);
            return ResponseEntity.ok("Producto especial con Descripción " + optProducto.get().getDescription()
                    + " eliminado por stock 0");
        } else {
            producto.setStock(nuevoStock);
            productosRepository.save(producto);
            return ResponseEntity.ok(producto);
        }
    }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable Long id) {
        Producto p = productosRepository.findById(id).orElse(null);
        if (p != null) {
            if (p.getStock() == 0) {
                productosRepository.delete(p);
            } else {
                throw new IllegalArgumentException("No se puede eliminar un producto con stock");
            }
        } else {
            throw new IllegalArgumentException("El producto no existe");
        }
    }
}
