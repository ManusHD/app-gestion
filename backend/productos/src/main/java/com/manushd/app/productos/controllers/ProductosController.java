package com.manushd.app.productos.controllers;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import java.util.Comparator;
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
import com.manushd.app.productos.models.TransferirEstadoDTO;
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
                producto.getEstado() == null ||
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

    @PutMapping("/transferir-estado")
    public ResponseEntity<?> transferirEstado(@RequestBody TransferirEstadoDTO dto) {
        try {
            // Corregir como indicaste: null sigue siendo null
            String estadoOrigenBuscar = dto.getEstadoOrigen() == null ? null : dto.getEstadoOrigen();
            String estadoDestinoBuscar = dto.getEstadoDestino() == null ? null : dto.getEstadoDestino();

            Optional<Producto> productoOrigenOpt = productosRepository.findByReferenciaAndEstado(
                    dto.getReferencia(), estadoOrigenBuscar);

            if (!productoOrigenOpt.isPresent()) {
                return ResponseEntity.badRequest()
                        .body("No se encontró producto con referencia " + dto.getReferencia() +
                                " y estado " + (dto.getEstadoOrigen() == null ? "SIN ESTADO" : dto.getEstadoOrigen()));
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
        try {
            // Buscar productos sin estado con esa referencia
            List<Producto> productosSinEstado = productosRepository.findByReferenciaAndEstadoOrderByReferenciaAsc(
                    dto.getReferencia(),
                    null);

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
}
