package com.manushd.app.productos.controllers;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.stream.StreamSupport;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import com.manushd.app.productos.models.CambioEstadoRequest;
import com.manushd.app.productos.models.EstadoStockDTO;
import com.manushd.app.productos.models.MigrarEstadoDTO;
import com.manushd.app.productos.models.Producto;
import com.manushd.app.productos.models.ProductoDescripcionUpdateDTO;
import com.manushd.app.productos.models.ProductoMultipleEstadosDTO;
import com.manushd.app.productos.models.ProductoUbicacion;
import com.manushd.app.productos.models.TransferirEstadoDTO;
import com.manushd.app.productos.models.Ubicacion;
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
        return productosRepository.findProductosNormalesOrderByReferenciaAndEstado();
    }

    @GetMapping("/byReferencia")
    public Page<Producto> getProductosOrdenados(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return productosRepository.findProductosNormalesOrderByReferenciaAndEstado(
                PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public Producto getProductoById(@PathVariable Long id) {
        return productosRepository.findById(id).orElse(null);
    }

    @GetMapping("/referencia/{referencia}")
    public ResponseEntity<?> obtenerProductoPorReferencia(@PathVariable String referencia) {
        try {

            System.err.println(referencia);

            // Usar el nuevo método que devuelve una lista ordenada por estado
            List<Producto> productos = productosRepository.findByReferenciaOrderByEstadoAsc(referencia);

            System.err.println("================= Productos encontrados: =================");
            System.err.println(productos);

            if (productos.isEmpty()) {
                System.err.println("================= isEmpty =================");
                return ResponseEntity.ok(null);
            }

            if (productos.size() == 1) {
                // Si solo hay un producto, devolverlo directamente (comportamiento original)
                System.err.println("================= Hay 1 =================");
                return ResponseEntity.ok(productos.get(0));
            }

            // Si hay múltiples productos (diferentes estados), devolver información
            // estructurada
            ProductoMultipleEstadosDTO response = new ProductoMultipleEstadosDTO();
            response.setReferencia(referencia);
            response.setDescription(productos.get(0).getDescription()); // Todos tendrán la misma descripción
            response.setEstados(productos.stream()
                    .map(p -> new EstadoStockDTO(p.getEstado(), p.getStock()))
                    .collect(Collectors.toList()));

            System.err.println("================= Hay muchos =================");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error al buscar producto por referencia " + referencia + ": " + e.getMessage());
            return ResponseEntity.ok(null); // Devolver null en caso de error para mantener compatibilidad
        }
    }

    // endpoint específico para obtener estados disponibles por referencia
    @GetMapping("/referencia/{referencia}/estados")
    public List<String> obtenerEstadosDisponibles(@PathVariable String referencia) {
        List<Producto> productos = productosRepository.findByReferenciaOrderByEstadoAsc(referencia);
        return productos.stream()
                .map(Producto::getEstado)
                .filter(estado -> estado != null)
                .distinct()
                .collect(Collectors.toList());
    }

    // endpoint para obtener producto específico por referencia y estado
    @GetMapping("/referencia/{referencia}/estado/{estado}")
    public Producto obtenerProductoPorReferenciaYEstado(
            @PathVariable String referencia,
            @PathVariable String estado) {
        return productosRepository.findByReferenciaAndEstado(referencia, estado).orElse(null);
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
        // Verificar si ya existe un producto con la misma referencia y estado
        Optional<Producto> existente = productosRepository.findByReferenciaAndEstado(
                producto.getReferencia(), producto.getEstado());

        if (existente.isPresent()) {
            throw new IllegalArgumentException("Ya existe un producto con la misma referencia y estado");
        }

        if (producto.getReferencia() == null || producto.getDescription() == null ||
                (producto.getEstado() == null || producto.getEstado().isEmpty()) ||
                producto.getReferencia().length() < 1 || producto.getDescription().length() < 1 ||
                producto.getEstado().length() < 1) {
            throw new IllegalArgumentException("La referencia, descripción y estado no pueden estar vacíos");
        }

        producto.setReferencia(producto.getReferencia().trim());
        producto.setDescription(producto.getDescription().trim());
        producto.setEstado(producto.getEstado().trim());

        if (producto.getStock() == null) {
            producto.setStock(0);
        }

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
     * Endpoint NUEVO para sumar stock a un producto específico por referencia y
     * estado
     */
    @PutMapping("/{ref}/estado/{estado}/sumar")
    public ResponseEntity<?> addStockByReferenciaAndEstado(
            @PathVariable String ref,
            @PathVariable String estado,
            @RequestBody Integer cantidad) {

        System.out.println("Sumando " + cantidad + " unidades a producto: " + ref + " con estado: " + estado);

        Optional<Producto> productoOpt = productosRepository.findByReferenciaAndEstado(ref, estado);

        if (productoOpt.isPresent()) {
            Producto producto = productoOpt.get();
            Integer nuevoStock = producto.getStock() + cantidad;
            producto.setStock(nuevoStock);
            Producto actualizado = productosRepository.save(producto);

            System.out.println("Stock actualizado para " + ref + " estado " + estado + ": " + nuevoStock);
            return ResponseEntity.ok(actualizado);
        } else {
            System.out.println("No se encontró producto con referencia: " + ref + " y estado: " + estado);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encontró producto con referencia " + ref + " y estado " + estado);
        }
    }

    /**
     * Endpoint NUEVO para restar stock a un producto específico por referencia y
     * estado
     */
    @PutMapping("/{ref}/estado/{estado}/restar")
    public ResponseEntity<?> subtractStockByReferenciaAndEstado(
            @PathVariable String ref,
            @PathVariable String estado,
            @RequestBody Integer cantidad) {

        System.out.println("Restando " + cantidad + " unidades a producto: " + ref + " con estado: " + estado);

        Optional<Producto> productoOpt = productosRepository.findByReferenciaAndEstado(ref, estado);

        if (productoOpt.isPresent()) {
            Producto producto = productoOpt.get();
            Integer nuevoStock = producto.getStock() - cantidad;

            if (nuevoStock >= 0) {
                producto.setStock(nuevoStock);
                Producto actualizado = productosRepository.save(producto);

                System.out.println("Stock reducido para " + ref + " estado " + estado + ": " + nuevoStock);
                return ResponseEntity.ok(actualizado);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Stock insuficiente. Stock actual: " + producto.getStock() + ", intentando restar: "
                                + cantidad);
            }
        } else {
            System.out.println("No se encontró producto con referencia: " + ref + " y estado: " + estado);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encontró producto con referencia " + ref + " y estado " + estado);
        }
    }

    /**
     * Endpoint LEGACY (mantener para compatibilidad) - Solo funciona si hay UN
     * producto con esa referencia
     */
    @PutMapping("/{ref}/sumar")
    public ResponseEntity<?> addStock(@PathVariable String ref, @RequestBody Integer cantidad) {
        List<Producto> productos = productosRepository.findByReferenciaOrderByEstadoAsc(ref);

        if (productos.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encontró producto con referencia: " + ref);
        }

        if (productos.size() > 1) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Existen múltiples productos con la referencia " + ref +
                            ". Use el endpoint /productos/{ref}/estado/{estado}/sumar para especificar el estado");
        }

        // Solo hay un producto con esa referencia
        Producto producto = productos.get(0);
        Integer nuevoStock = producto.getStock() + cantidad;
        producto.setStock(nuevoStock);
        Producto actualizado = productosRepository.save(producto);

        System.out.println("Stock actualizado para " + ref + " estado " + producto.getEstado() + ": " + nuevoStock);
        return ResponseEntity.ok(actualizado);
    }

    /**
     * Endpoint LEGACY (mantener para compatibilidad) - Solo funciona si hay UN
     * producto con esa referencia
     */
    @PutMapping("/{ref}/restar")
    public ResponseEntity<?> subtractStock(@PathVariable String ref, @RequestBody Integer cantidad) {
        List<Producto> productos = productosRepository.findByReferenciaOrderByEstadoAsc(ref);

        if (productos.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encontró producto con referencia: " + ref);
        }

        if (productos.size() > 1) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Existen múltiples productos con la referencia " + ref +
                            ". Use el endpoint /productos/{ref}/estado/{estado}/restar para especificar el estado");
        }

        // Solo hay un producto con esa referencia
        Producto producto = productos.get(0);
        Integer nuevoStock = producto.getStock() - cantidad;

        if (nuevoStock >= 0) {
            producto.setStock(nuevoStock);
            Producto actualizado = productosRepository.save(producto);

            System.out.println("Stock reducido para " + ref + " estado " + producto.getEstado() + ": " + nuevoStock);
            return ResponseEntity.ok(actualizado);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Stock insuficiente. Stock actual: " + producto.getStock() + ", intentando restar: "
                            + cantidad);
        }
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
                    .body("Producto especial con Descripción '" + description + "' no encontrado");
        }

        Producto producto = optProducto.get();
        int nuevoStock = producto.getStock() - cantidad;

        if (nuevoStock < 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("No hay stock suficiente para el producto especial con Descripción " + description);
        } else if (nuevoStock == 0) {
            productosRepository.delete(producto);
            return ResponseEntity.ok("Producto especial con Descripción " + description + " eliminado por stock 0");
        } else {
            producto.setStock(nuevoStock);
            productosRepository.save(producto);
            return ResponseEntity.ok(producto);
        }
    }

    @PutMapping("/sinreferencia/restarEspecial/{description}")
    public ResponseEntity<?> subtractStockEspecialSR(@PathVariable String description, @RequestBody Integer cantidad) {
        System.out.println("=== RESTAR STOCK SIN REFERENCIA ===");
        System.out.println("Descripción: " + description);
        System.out.println("Cantidad a restar: " + cantidad);

        try {
            Optional<Producto> optProducto = productosRepository.findByReferenciaAndDescription("SIN REFERENCIA",
                    description);

            if (!optProducto.isPresent()) {
                System.err.println("Producto SIN REFERENCIA no encontrado con descripción: " + description);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Producto especial con Descripción '" + description + "' no encontrado");
            }

            Producto producto = optProducto.get();
            int stockActual = producto.getStock();
            int nuevoStock = stockActual - cantidad;

            System.out.println("Stock actual: " + stockActual + ", Nuevo stock: " + nuevoStock);

            if (nuevoStock < 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("No hay stock suficiente para el producto especial con Descripción " + description +
                                ". Stock actual: " + stockActual + ", Solicitado: " + cantidad);
            } else if (nuevoStock == 0) {
                productosRepository.delete(producto);
                System.out.println("Producto eliminado por stock 0");
                return ResponseEntity.ok("Producto especial con Descripción " + description + " eliminado por stock 0");
            } else {
                producto.setStock(nuevoStock);
                productosRepository.save(producto);
                System.out.println("Stock actualizado correctamente");
                return ResponseEntity.ok(producto);
            }

        } catch (Exception e) {
            System.err.println("Error en subtractStockEspecialSR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error interno del servidor: " + e.getMessage());
        }
    }

    @PutMapping("/transferir-estado")
    public ResponseEntity<?> transferirEstado(@RequestBody TransferirEstadoDTO dto) {
        try {
            // Corregir como indicaste: null sigue siendo null
            String estadoOrigenBuscar = (dto.getEstadoOrigen() == null || dto.getEstadoOrigen().isEmpty()) ? ""
                    : dto.getEstadoOrigen();
            String estadoDestinoBuscar = (dto.getEstadoDestino() == null || dto.getEstadoDestino().isEmpty()) ? ""
                    : dto.getEstadoDestino();

            Optional<Producto> productoOrigenOpt = productosRepository.findByReferenciaAndEstado(
                    dto.getReferencia(), estadoOrigenBuscar);

            if (!productoOrigenOpt.isPresent()) {
                return ResponseEntity.badRequest()
                        .body("No se encontró producto con referencia " + dto.getReferencia() +
                                " y estado "
                                + ((dto.getEstadoOrigen() == null || dto.getEstadoOrigen().isEmpty()) ? "SIN ESTADO"
                                        : dto.getEstadoOrigen()));
            }

            Producto productoOrigen = productoOrigenOpt.get();

            // Verificar que hay suficiente stock
            if (productoOrigen.getStock() < dto.getCantidad()) {
                return ResponseEntity.badRequest()
                        .body("Stock insuficiente. Stock actual: " + productoOrigen.getStock());
            }

            // Buscar o crear producto destino
            Optional<Producto> productoDestinoOpt = productosRepository.findByReferenciaAndEstado(
                    dto.getReferencia(), estadoDestinoBuscar);

            Producto productoDestino;
            if (productoDestinoOpt.isPresent()) {
                productoDestino = productoDestinoOpt.get();
            } else {
                // Crear nuevo producto con el estado destino
                productoDestino = new Producto();
                productoDestino.setReferencia(dto.getReferencia());
                productoDestino.setDescription(productoOrigen.getDescription());
                productoDestino.setEstado(estadoDestinoBuscar); // Puede ser null
                productoDestino.setStock(0);
            }

            // Actualizar stocks
            productoOrigen.setStock(productoOrigen.getStock() - dto.getCantidad());
            productoDestino.setStock(productoDestino.getStock() + dto.getCantidad());

            // Guardar cambios
            productosRepository.save(productoDestino);

            // Si el producto origen queda sin stock, eliminarlo
            if (productoOrigen.getStock() == 0) {
                productosRepository.delete(productoOrigen);
            } else {
                productosRepository.save(productoOrigen);
            }

            return ResponseEntity.ok("Transferencia realizada correctamente");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al transferir estado: " + e.getMessage());
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

    // NUEVO ENDPOINT en ProductosController para eliminar grupo completo
    @DeleteMapping("/grupo/{referencia}")
    public ResponseEntity<?> eliminarGrupoProductos(@PathVariable String referencia) {
        try {
            // Buscar todos los productos con esa referencia
            List<Producto> productos = productosRepository.findByReferenciaExcludingSpecial(referencia);

            if (productos.isEmpty()) {
                return ResponseEntity.badRequest().body("No se encontraron productos con la referencia: " + referencia);
            }

            // Verificar que no hay stock en ningún estado
            boolean tieneStock = productos.stream().anyMatch(p -> p.getStock() > 0);
            if (tieneStock) {
                return ResponseEntity.badRequest()
                        .body("No se puede eliminar: existe stock en uno o más estados");
            }

            // Eliminar todos los productos
            productos.forEach(producto -> productosRepository.delete(producto));

            return ResponseEntity.ok("Grupo de productos eliminado correctamente");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al eliminar grupo de productos: " + e.getMessage());
        }
    }

    @PostMapping("/migrar-sin-estado")
    public ResponseEntity<?> migrarProductosSinEstado(@RequestBody MigrarEstadoDTO dto,
            @RequestHeader("Authorization") String token) {
        System.out.println("================= DTO =================");
        System.out.println(dto.getReferencia());
        System.out.println(dto.getEstadoDestino());
        try {
            // Buscar productos sin estado con esa referencia
            List<Producto> productosSinEstado = productosRepository.findByReferenciaAndEstadoOrderByReferenciaAsc(
                    dto.getReferencia(),
                    "");

            System.out.println("================= Productos sin estado =================");
            System.out.println(productosSinEstado);

            if (productosSinEstado.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("No se encontraron productos sin estado con referencia: " + dto.getReferencia());
            }

            // Transferir todos los productos sin estado al estado especificado
            for (Producto producto : productosSinEstado) {
                // Buscar si ya existe un producto con el estado destino
                Optional<Producto> productoDestinoOpt = productosRepository.findByReferenciaAndEstado(
                        dto.getReferencia(), dto.getEstadoDestino());

                if (productoDestinoOpt.isPresent()) {
                    // Sumar el stock al existente
                    Producto productoDestino = productoDestinoOpt.get();
                    productoDestino.setStock(productoDestino.getStock() + producto.getStock());
                    productosRepository.save(productoDestino);
                    // Eliminar el producto sin estado
                    productosRepository.delete(producto);
                } else {
                    // Simplemente asignar el estado al producto existente
                    producto.setEstado(dto.getEstadoDestino());
                    productosRepository.save(producto);
                }
            }

            // MODIFICADO: Pasar el token de autorización
            actualizarEstadoEnUbicaciones(dto.getReferencia(), dto.getEstadoDestino(), token);

            return ResponseEntity
                    .ok("Productos y ubicaciones migrados correctamente al estado: " + dto.getEstadoDestino());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al migrar productos: " + e.getMessage());
        }
    }

    private void actualizarEstadoEnUbicaciones(String referencia, String estadoDestino, String token) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://localhost:8095/ubicaciones/productos/migrar-estado";

        MigrarEstadoDTO dto = new MigrarEstadoDTO();
        dto.setReferencia(referencia);
        dto.setEstadoDestino(estadoDestino);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", token); // AGREGAR TOKEN

        HttpEntity<MigrarEstadoDTO> requestEntity = new HttpEntity<>(dto, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PUT, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("Ubicaciones actualizadas correctamente: " + response.getBody());
            } else {
                System.err.println(
                        "Error al actualizar ubicaciones: " + response.getStatusCode() + " - " + response.getBody());
            }
        } catch (Exception e) {
            // Log más detallado del error
            System.err.println("Error al actualizar ubicaciones durante migración: " + e.getClass().getSimpleName()
                    + " - " + e.getMessage());
            e.printStackTrace();
        }
    }

    @PostMapping("/actualizar-estado")
    public ResponseEntity<?> actualizarEstado(@RequestBody CambioEstadoRequest request) {
        try {
            List<Producto> productos = productosRepository.findByEstado(request.getNombreAnterior());

            for (Producto producto : productos) {
                producto.setEstado(request.getNombreNuevo());
                productosRepository.save(producto);
            }

            return ResponseEntity.ok("Estados actualizados: " + productos.size() + " productos");
        } catch (Exception e) {
            System.err.println("Error actualizando estados en productos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error actualizando estados");
        }
    }

    @GetMapping("/verificar-estado/{estado}")
    public ResponseEntity<Boolean> verificarEstadoEnUso(@PathVariable String estado) {
        try {
            // Usar el método existente o crear uno nuevo en el repository
            List<Producto> productos = productosRepository.findByEstado(estado);
            return ResponseEntity.ok(!productos.isEmpty());
        } catch (Exception e) {
            System.err.println("Error verificando estado: " + e.getMessage());
            return ResponseEntity.ok(true); // Ser conservador en caso de error
        }
    }

    @PostMapping("/sincronizar-desde-ubicaciones")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> sincronizarDesdeUbicaciones(@RequestHeader("Authorization") String token) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", token);

            // Obtener todas las ubicaciones
            String urlUbicaciones = "http://localhost:8095/ubicaciones";
            HttpEntity<String> requestEntity = new HttpEntity<>(headers);
            ResponseEntity<Ubicacion[]> responseUbicaciones = restTemplate.exchange(
                    urlUbicaciones, HttpMethod.GET, requestEntity, Ubicacion[].class);

            if (responseUbicaciones.getBody() == null) {
                return ResponseEntity.badRequest().body("No se pudieron obtener las ubicaciones");
            }

            // Para productos normales: Clave = "referencia|estado"
            Map<String, Map<String, Object>> stockProductosNormales = new HashMap<>();

            // Para productos especiales: Clave = "referencia|descripcion" (sin estado)
            Map<String, Map<String, Object>> stockProductosEspeciales = new HashMap<>();

            // Procesar todas las ubicaciones y productos
            for (Ubicacion ubicacion : responseUbicaciones.getBody()) {
                if (ubicacion.getProductos() != null) {
                    for (ProductoUbicacion pu : ubicacion.getProductos()) {

                        if (esProductoEspecial(pu.getRef())) {
                            // PRODUCTOS ESPECIALES: "SIN REFERENCIA" o "VISUAL"
                            String claveEspecial = pu.getRef() + "|" + pu.getDescription();

                            Map<String, Object> datos = stockProductosEspeciales.computeIfAbsent(claveEspecial,
                                    k -> new HashMap<>());
                            datos.merge("stock", pu.getUnidades(), (a, b) -> (Integer) a + (Integer) b);
                            datos.put("descripcion", pu.getDescription());
                            datos.put("referencia", pu.getRef());
                            datos.put("estado", null);

                        } else {
                            // PRODUCTOS NORMALES: referencia + estado
                            String claveNormal = pu.getRef() + "|"
                                    + ((pu.getEstado() != null && !pu.getEstado().isEmpty()) ? pu.getEstado() : "");

                            Map<String, Object> datos = stockProductosNormales.computeIfAbsent(claveNormal,
                                    k -> new HashMap<>());
                            datos.merge("stock", pu.getUnidades(), (a, b) -> (Integer) a + (Integer) b);
                            datos.put("descripcion", pu.getDescription());
                            datos.put("referencia", pu.getRef());
                            datos.put("estado", pu.getEstado());
                        }
                    }
                }
            }

            int productosCreados = 0;
            int productosActualizados = 0;
            int duplicadosEliminados = 0;

            // 1. SINCRONIZAR PRODUCTOS NORMALES
            for (Map.Entry<String, Map<String, Object>> entry : stockProductosNormales.entrySet()) {
                String[] partes = entry.getKey().split("\\|", 2);
                String referencia = partes[0];
                String estado = partes[1].equals("NULL") ? "" : partes[1];
                Integer stockTotal = (Integer) entry.getValue().get("stock");
                String descripcion = (String) entry.getValue().get("descripcion");

                if (stockTotal > 0) {
                    List<Producto> productosExistentes = productosRepository
                            .findByReferenciaAndEstadoOrderByReferenciaAsc(referencia, estado);

                    if (!productosExistentes.isEmpty()) {
                        // Actualizar el primero, eliminar duplicados
                        Producto productoAConservar = productosExistentes.get(0);
                        productoAConservar.setStock(stockTotal);
                        productoAConservar.setDescription(descripcion);
                        productosRepository.save(productoAConservar);
                        productosActualizados++;

                        // Eliminar duplicados
                        for (int i = 1; i < productosExistentes.size(); i++) {
                            productosRepository.delete(productosExistentes.get(i));
                            duplicadosEliminados++;
                        }
                    } else {
                        // Crear nuevo producto normal
                        Producto nuevoProducto = new Producto();
                        nuevoProducto.setReferencia(referencia);
                        nuevoProducto.setDescription(descripcion);
                        nuevoProducto.setEstado(estado);
                        nuevoProducto.setStock(stockTotal);
                        productosRepository.save(nuevoProducto);
                        productosCreados++;
                    }
                }
            }

            // 2. SINCRONIZAR PRODUCTOS ESPECIALES - MODIFICADO PARA MANEJAR DUPLICADOS
            for (Map.Entry<String, Map<String, Object>> entry : stockProductosEspeciales.entrySet()) {
                String[] partes = entry.getKey().split("\\|", 2);
                String referencia = partes[0]; // "SIN REFERENCIA" o "VISUAL"
                String descripcion = partes[1]; // La descripción completa
                Integer stockTotal = (Integer) entry.getValue().get("stock");

                if (stockTotal > 0) {
                    // MODIFICADO: Buscar por referencia Y descripción usando findAll en lugar de
                    // findByReferenciaAndDescription
                    List<Producto> productosExistentes = StreamSupport
                            .stream(productosRepository.findAll().spliterator(), false)
                            .filter(p -> referencia.equals(p.getReferencia()) && descripcion.equals(p.getDescription()))
                            .collect(Collectors.toList());

                    if (!productosExistentes.isEmpty()) {
                        // Actualizar el primero y eliminar duplicados
                        Producto productoAConservar = productosExistentes.get(0);
                        productoAConservar.setStock(stockTotal);
                        productosRepository.save(productoAConservar);
                        productosActualizados++;

                        // Eliminar duplicados
                        for (int i = 1; i < productosExistentes.size(); i++) {
                            productosRepository.delete(productosExistentes.get(i));
                            duplicadosEliminados++;
                        }
                    } else {
                        // Crear nuevo producto especial
                        Producto nuevoProductoEspecial = new Producto();
                        nuevoProductoEspecial.setReferencia(referencia);
                        nuevoProductoEspecial.setDescription(descripcion);
                        nuevoProductoEspecial.setEstado("");
                        nuevoProductoEspecial.setStock(stockTotal);
                        productosRepository.save(nuevoProductoEspecial);
                        productosCreados++;
                    }
                }
            }

            // 3. LIMPIAR PRODUCTOS QUE NO EXISTEN EN UBICACIONES
            List<Producto> todosLosProductos = (List<Producto>) productosRepository.findAll();
            int productosEliminados = 0;

            for (Producto producto : todosLosProductos) {
                boolean existeEnUbicaciones = false;

                if (esProductoEspecial(producto.getReferencia())) {
                    // Para productos especiales, verificar en el mapa de especiales
                    String claveEspecial = producto.getReferencia() + "|" + producto.getDescription();
                    Map<String, Object> datosStock = stockProductosEspeciales.get(claveEspecial);
                    existeEnUbicaciones = (datosStock != null && (Integer) datosStock.get("stock") > 0);

                } else {
                    // Para productos normales, verificar en el mapa de normales
                    String claveNormal = producto.getReferencia() + "|"
                            + ((producto.getEstado() != null && !producto.getEstado().isEmpty()) ? producto.getEstado()
                                    : "");
                    Map<String, Object> datosStock = stockProductosNormales.get(claveNormal);
                    existeEnUbicaciones = (datosStock != null && (Integer) datosStock.get("stock") > 0);
                }

                if (!existeEnUbicaciones) {
                    productosRepository.delete(producto);
                    productosEliminados++;
                }
            }

            String mensaje = String.format(
                    "Sincronización completada: %d productos creados, %d actualizados, %d duplicados eliminados, %d productos eliminados (sin stock/huérfanos)",
                    productosCreados, productosActualizados, duplicadosEliminados, productosEliminados);

            return ResponseEntity.ok(mensaje);

        } catch (Exception e) {
            System.err.println("Error durante la sincronización: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error durante la sincronización: " + e.getMessage());
        }
    }

    @GetMapping("/uniqueProducts")
    public ResponseEntity<Map<String, Object>> getUniqueProductsPaginado(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            // PASO 1: Obtener TODOS los productos para calcular correctamente el total
            // único
            Iterable<Producto> todosLosProductos = productosRepository
                    .findProductosNormalesOrderByReferenciaAndEstado();

            // PASO 2: Agrupar por clave única manteniendo el orden por referencia
            Map<String, List<Producto>> productosAgrupados = new LinkedHashMap<>(); // LinkedHashMap mantiene el orden

            for (Producto producto : todosLosProductos) {
                String clave;
                if (esProductoEspecial(producto.getReferencia())) {
                    clave = producto.getReferencia() + "_" + producto.getDescription();
                } else {
                    clave = producto.getReferencia();
                }

                productosAgrupados.computeIfAbsent(clave, k -> new ArrayList<>()).add(producto);
            }

            // PASO 3: Obtener las claves ordenadas (ya están ordenadas por LinkedHashMap)
            List<String> clavesOrdenadas = new ArrayList<>(productosAgrupados.keySet());
            int totalProductosUnicos = clavesOrdenadas.size();

            // PASO 4: Aplicar paginación sobre los productos únicos
            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, totalProductosUnicos);

            List<Producto> productosParaPagina = new ArrayList<>();

            if (startIndex < totalProductosUnicos) {
                for (int i = startIndex; i < endIndex; i++) {
                    String clave = clavesOrdenadas.get(i);
                    List<Producto> grupoProductos = productosAgrupados.get(clave);

                    // Ordenar el grupo por estado antes de agregarlo
                    grupoProductos.sort((p1, p2) -> {
                        String estado1 = p1.getEstado() != null ? p1.getEstado() : "SIN ESTADO";
                        String estado2 = p2.getEstado() != null ? p2.getEstado() : "SIN ESTADO";
                        return estado1.compareTo(estado2);
                    });

                    productosParaPagina.addAll(grupoProductos);
                }
            }

            // PASO 5: Preparar respuesta con datos correctos
            Map<String, Object> response = new HashMap<>();
            response.put("content", productosParaPagina);
            response.put("totalElements", totalProductosUnicos); // Total de productos únicos (CORREGIDO)
            response.put("totalPages", (int) Math.ceil((double) totalProductosUnicos / size));
            response.put("size", size);
            response.put("number", page);
            response.put("first", page == 0);
            response.put("last", page >= (int) Math.ceil((double) totalProductosUnicos / size) - 1);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error en getUniqueProductsPaginado: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Método similar para búsquedas por referencia
    @GetMapping("/uniqueProducts/referencia/{referencia}")
    public ResponseEntity<Map<String, Object>> getUniqueProductsPorReferenciaPaginado(
            @PathVariable String referencia,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            // Obtener todos los productos que coincidan con la búsqueda
            Iterable<Producto> todosLosProductos = productosRepository
                    .findByReferenciaContainingIgnoreCaseOrderByReferenciaAsc(referencia);

            // Agrupar manteniendo orden
            Map<String, List<Producto>> productosAgrupados = new LinkedHashMap<>();

            for (Producto producto : todosLosProductos) {
                String clave;
                if (esProductoEspecial(producto.getReferencia())) {
                    clave = producto.getReferencia() + "_" + producto.getDescription();
                } else {
                    clave = producto.getReferencia();
                }

                productosAgrupados.computeIfAbsent(clave, k -> new ArrayList<>()).add(producto);
            }

            // Aplicar paginación
            List<String> clavesOrdenadas = new ArrayList<>(productosAgrupados.keySet());
            int totalProductosUnicos = clavesOrdenadas.size();

            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, totalProductosUnicos);

            List<Producto> productosParaPagina = new ArrayList<>();

            if (startIndex < totalProductosUnicos) {
                for (int i = startIndex; i < endIndex; i++) {
                    String clave = clavesOrdenadas.get(i);
                    List<Producto> grupoProductos = productosAgrupados.get(clave);

                    grupoProductos.sort((p1, p2) -> {
                        String estado1 = p1.getEstado() != null ? p1.getEstado() : "SIN ESTADO";
                        String estado2 = p2.getEstado() != null ? p2.getEstado() : "SIN ESTADO";
                        return estado1.compareTo(estado2);
                    });

                    productosParaPagina.addAll(grupoProductos);
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("content", productosParaPagina);
            response.put("totalElements", totalProductosUnicos);
            response.put("totalPages", (int) Math.ceil((double) totalProductosUnicos / size));
            response.put("size", size);
            response.put("number", page);
            response.put("first", page == 0);
            response.put("last", page >= (int) Math.ceil((double) totalProductosUnicos / size) - 1);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error en búsqueda por referencia: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Método similar para búsquedas por descripción
    @GetMapping("/uniqueProducts/descripcion/{descripcion}")
    public ResponseEntity<Map<String, Object>> getUniqueProductsPorDescripcionPaginado(
            @PathVariable String descripcion,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            Iterable<Producto> todosLosProductos = productosRepository
                    .findByDescriptionContainingIgnoreCaseOrderByDescriptionAsc(descripcion);

            Map<String, List<Producto>> productosAgrupados = new LinkedHashMap<>();

            for (Producto producto : todosLosProductos) {
                String clave;
                if (esProductoEspecial(producto.getReferencia())) {
                    clave = producto.getReferencia() + "_" + producto.getDescription();
                } else {
                    clave = producto.getReferencia();
                }

                productosAgrupados.computeIfAbsent(clave, k -> new ArrayList<>()).add(producto);
            }

            List<String> clavesOrdenadas = new ArrayList<>(productosAgrupados.keySet());
            int totalProductosUnicos = clavesOrdenadas.size();

            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, totalProductosUnicos);

            List<Producto> productosParaPagina = new ArrayList<>();

            if (startIndex < totalProductosUnicos) {
                for (int i = startIndex; i < endIndex; i++) {
                    String clave = clavesOrdenadas.get(i);
                    List<Producto> grupoProductos = productosAgrupados.get(clave);

                    grupoProductos.sort((p1, p2) -> {
                        String estado1 = p1.getEstado() != null ? p1.getEstado() : "SIN ESTADO";
                        String estado2 = p2.getEstado() != null ? p2.getEstado() : "SIN ESTADO";
                        return estado1.compareTo(estado2);
                    });

                    productosParaPagina.addAll(grupoProductos);
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("content", productosParaPagina);
            response.put("totalElements", totalProductosUnicos);
            response.put("totalPages", (int) Math.ceil((double) totalProductosUnicos / size));
            response.put("size", size);
            response.put("number", page);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Método auxiliar para identificar productos especiales
    private boolean esProductoEspecial(String referencia) {
        if (referencia == null)
            return false;
        return "VISUAL".equals(referencia) || "SIN REFERENCIA".equals(referencia);
    }

    @GetMapping("/stock-disponible/{referencia}/estado/{estado}/ubicacion/{ubicacion}")
    public ResponseEntity<Map<String, Integer>> getStockDisponibleReal(
            @PathVariable String referencia,
            @PathVariable String estado,
            @PathVariable String ubicacion,
            @RequestHeader("Authorization") String token) {
        try {
            Map<String, Integer> resultado = new HashMap<>();

            // Obtener stock actual del producto en la ubicación
            int stockActual = obtenerStockEnUbicacion(referencia, estado, ubicacion, token);

            // Obtener unidades ya asignadas en envíos pendientes
            int unidadesEnUso = obtenerUnidadesEnUsoEnviosPendientes(referencia, estado, ubicacion, token);

            // Calcular stock disponible real
            int stockDisponible = Math.max(0, stockActual - unidadesEnUso);

            resultado.put("stockTotal", stockActual);
            resultado.put("unidadesEnUso", unidadesEnUso);
            resultado.put("stockDisponible", stockDisponible);

            System.out.println("=== STOCK CALCULATION ===");
            System.out.println("Producto: " + referencia + " - Estado: " + estado + " - Ubicación: " + ubicacion);
            System.out.println("Stock Total: " + stockActual);
            System.out.println("Unidades en Uso: " + unidadesEnUso);
            System.out.println("Stock Disponible: " + stockDisponible);

            return ResponseEntity.ok(resultado);

        } catch (Exception e) {
            System.err.println("Error al calcular stock disponible: " + e.getMessage());
            e.printStackTrace();
            Map<String, Integer> error = new HashMap<>();
            error.put("stockTotal", 0);
            error.put("unidadesEnUso", 0);
            error.put("stockDisponible", 0);
            return ResponseEntity.ok(error);
        }
    }

    private int obtenerStockEnUbicacion(String referencia, String estado, String ubicacion, String token) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", token);
            HttpEntity<String> requestEntity = new HttpEntity<>(headers);

            String url = "http://localhost:8095/ubicaciones/referencia/" + referencia + "/estado/" + estado;

            ResponseEntity<Ubicacion[]> response = restTemplate.exchange(
                    url, HttpMethod.GET, requestEntity, Ubicacion[].class);

            Ubicacion[] ubicaciones = response.getBody();

            if (ubicaciones != null) {
                for (Ubicacion ubi : ubicaciones) {
                    if (ubi.getNombre().equals(ubicacion)) {
                        for (ProductoUbicacion producto : ubi.getProductos()) {
                            if (producto.getRef().equals(referencia) &&
                                    Objects.equals(producto.getEstado(), estado)) {
                                System.out.println(
                                        "Stock encontrado en ubicación " + ubicacion + ": " + producto.getUnidades());
                                return producto.getUnidades();
                            }
                        }
                    }
                }
            }

            System.out.println("No se encontró stock para " + referencia + " en " + ubicacion);
            return 0;
        } catch (Exception e) {
            System.err.println("Error al obtener stock en ubicación: " + e.getMessage());
            return 0;
        }
    }

    private int obtenerUnidadesEnUsoEnviosPendientes(String referencia, String estado, String ubicacion, String token) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", token);
            HttpEntity<String> requestEntity = new HttpEntity<>(headers);

            // Consultar salidas pendientes de envío (estado=false, rellena=true)
            String url = "http://localhost:8093/salidas/estado/false/rellena/true/paginado?page=0&size=1000";

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, requestEntity, Map.class);

            Map<String, Object> pageResponse = response.getBody();
            List<Map<String, Object>> salidasPendientes = (List<Map<String, Object>>) pageResponse.get("content");

            int unidadesEnUso = 0;

            if (salidasPendientes != null) {
                for (Map<String, Object> salida : salidasPendientes) {
                    List<Map<String, Object>> productos = (List<Map<String, Object>>) salida.get("productos");

                    if (productos != null) {
                        for (Map<String, Object> producto : productos) {
                            String prodRef = (String) producto.get("ref");
                            String prodEstado = (String) producto.get("estado");
                            String prodUbicacion = (String) producto.get("ubicacion");
                            Integer prodUnidades = (Integer) producto.get("unidades");

                            if (prodRef != null && prodRef.equals(referencia) &&
                                    Objects.equals(prodEstado, estado) &&
                                    prodUbicacion != null && prodUbicacion.equals(ubicacion) &&
                                    prodUnidades != null) {
                                unidadesEnUso += prodUnidades;
                                System.out.println("Unidades en uso encontradas: " + prodUnidades + " en salida ID: "
                                        + salida.get("id"));
                            }
                        }
                    }
                }
            }

            System.out.println("Total unidades en uso para " + referencia + " en " + ubicacion + ": " + unidadesEnUso);
            return unidadesEnUso;

        } catch (Exception e) {
            System.err.println("Error al obtener unidades en uso: " + e.getMessage());
            e.printStackTrace();
            return 0;
        }
    }

    @GetMapping("/stock-disponible-envios/{referencia}/estado/{estado}/ubicacion/{ubicacion}/excluir/{salidaId}")
    public ResponseEntity<Map<String, Integer>> getStockDisponibleEnvios(
            @PathVariable String referencia,
            @PathVariable String estado,
            @PathVariable String ubicacion,
            @PathVariable Long salidaId,
            @RequestHeader("Authorization") String token) {
        try {
            Map<String, Integer> resultado = new HashMap<>();

            // Obtener stock actual del producto en la ubicación
            int stockActual = obtenerStockEnUbicacion(referencia, estado, ubicacion, token);

            // Obtener unidades ya asignadas en OTROS envíos pendientes (excluyendo el
            // actual)
            int unidadesEnUsoOtros = obtenerUnidadesEnUsoOtrosEnvios(referencia, estado, ubicacion, salidaId, token);

            // Calcular stock disponible real
            int stockDisponible = Math.max(0, stockActual - unidadesEnUsoOtros);

            resultado.put("stockTotal", stockActual);
            resultado.put("unidadesEnUsoOtros", unidadesEnUsoOtros);
            resultado.put("stockDisponible", stockDisponible);

            System.out.println("=== STOCK CALCULATION ENVIOS ===");
            System.out.println("Producto: " + referencia + " - Estado: " + estado + " - Ubicación: " + ubicacion);
            System.out.println("Excluyendo Salida ID: " + salidaId);
            System.out.println("Stock Total: " + stockActual);
            System.out.println("Unidades en Uso (otros envíos): " + unidadesEnUsoOtros);
            System.out.println("Stock Disponible: " + stockDisponible);

            return ResponseEntity.ok(resultado);

        } catch (Exception e) {
            System.err.println("Error al calcular stock disponible para envíos: " + e.getMessage());
            e.printStackTrace();
            Map<String, Integer> error = new HashMap<>();
            error.put("stockTotal", 0);
            error.put("unidadesEnUsoOtros", 0);
            error.put("stockDisponible", 0);
            return ResponseEntity.ok(error);
        }
    }

    private int obtenerUnidadesEnUsoOtrosEnvios(String referencia, String estado, String ubicacion,
            Long salidaIdExcluir, String token) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", token);
            HttpEntity<String> requestEntity = new HttpEntity<>(headers);

            // Consultar salidas pendientes de envío (estado=false, rellena=true)
            String url = "http://localhost:8093/salidas/estado/false/rellena/true/paginado?page=0&size=1000";

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, requestEntity, Map.class);

            Map<String, Object> pageResponse = response.getBody();
            List<Map<String, Object>> salidasPendientes = (List<Map<String, Object>>) pageResponse.get("content");

            int unidadesEnUso = 0;

            if (salidasPendientes != null) {
                for (Map<String, Object> salida : salidasPendientes) {
                    // IMPORTANTE: Excluir la salida actual
                    Object salidaIdObj = salida.get("id");
                    Long salidaId = null;
                    if (salidaIdObj instanceof Integer) {
                        salidaId = ((Integer) salidaIdObj).longValue();
                    } else if (salidaIdObj instanceof Long) {
                        salidaId = (Long) salidaIdObj;
                    }

                    if (salidaId != null && salidaId.equals(salidaIdExcluir)) {
                        System.out.println("Excluyendo salida ID: " + salidaId);
                        continue; // Saltar la salida actual
                    }

                    List<Map<String, Object>> productos = (List<Map<String, Object>>) salida.get("productos");

                    if (productos != null) {
                        for (Map<String, Object> producto : productos) {
                            String prodRef = (String) producto.get("ref");
                            String prodEstado = (String) producto.get("estado");
                            String prodUbicacion = (String) producto.get("ubicacion");
                            Integer prodUnidades = (Integer) producto.get("unidades");

                            if (prodRef != null && prodRef.equals(referencia) &&
                                    Objects.equals(prodEstado, estado) &&
                                    prodUbicacion != null && prodUbicacion.equals(ubicacion) &&
                                    prodUnidades != null) {
                                unidadesEnUso += prodUnidades;
                                System.out.println("Unidades en uso (otros envíos): " + prodUnidades + " en salida ID: "
                                        + salidaId);
                            }
                        }
                    }
                }
            }

            System.out.println("Total unidades en uso (otros envíos) para " + referencia + " en " + ubicacion + ": "
                    + unidadesEnUso);
            return unidadesEnUso;

        } catch (Exception e) {
            System.err.println("Error al obtener unidades en uso (otros envíos): " + e.getMessage());
            e.printStackTrace();
            return 0;
        }
    }
}
