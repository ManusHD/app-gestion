package com.manushd.app.ubicaciones.controllers;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import com.manushd.app.ubicaciones.models.Ubicacion;
import com.manushd.app.ubicaciones.models.ProductoUbicacion;
import com.manushd.app.ubicaciones.models.ReubicacionRequest;
import com.manushd.app.ubicaciones.models.TransferirEstadoDTO;
import com.manushd.app.ubicaciones.models.TransferirEstadoUbicacionDTO;
import com.manushd.app.ubicaciones.models.CambioEstadoRequest;
import com.manushd.app.ubicaciones.models.MigrarEstadoUbicacionDTO;
import com.manushd.app.ubicaciones.models.Producto;
import com.manushd.app.ubicaciones.models.ProductoDescripcionUpdateDTO;
import com.manushd.app.ubicaciones.repository.UbicacionesRepository;

@Controller
@RestController
@RequestMapping("/ubicaciones")
@PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
public class UbicacionesController {
    @Autowired
    private UbicacionesRepository ubicacionesRepository;

    @GetMapping("/paginadas")
    public Page<Ubicacion> getUbicacionesOrderByNombrePaginadas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        System.err.println("Entro: " + page + " - " + size);
        return ubicacionesRepository.findAllByOrderByNombreAsc(
                PageRequest.of(page, size));
    }

    @GetMapping("")
    public Iterable<Ubicacion> getUbicacionesOrderByNombre() {
        return ubicacionesRepository.findAllByOrderByNombreAsc();
    }

    @GetMapping("/{id}")
    public Ubicacion getUbicacionById(@PathVariable Long id) {
        return ubicacionesRepository.findById(id).orElse(null);
    }

    @PostMapping("")
    public Ubicacion addUbicacion(@RequestBody Ubicacion ubicacion) {
        Ubicacion ubiAux = ubicacionesRepository.findByNombre(ubicacion.getNombre()).orElse(null);
        if (ubiAux != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La ubicación ya existe");
        } else if (ubicacion.getNombre().isEmpty() || ubicacion.getNombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de la ubicación no puede estar vacío");
        }
        return ubicacionesRepository.save(ubicacion);
    }

    @GetMapping("/nombre/{nombre}")
    public Ubicacion obtenerUbicacionPorNombre(@PathVariable String nombre) {
        return ubicacionesRepository.findByNombre(nombre).orElse(null);
    }

    @GetMapping("/nombre/{nombre}/coincidentes/paginado")
    public Page<Ubicacion> obtenerUbicacionesPorNombre(
            @PathVariable String nombre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ubicacionesRepository.findByNombreContainingIgnoreCaseOrderByNombreAsc(
                nombre, PageRequest.of(page, size));
    }

    @GetMapping("/nombre/{nombre}/coincidentes")
    public Iterable<Ubicacion> obtenerUbicacionesPorNombre(@PathVariable String nombre) {
        return ubicacionesRepository.findByNombreContainingIgnoreCaseOrderByNombreAsc(nombre);
    }

    @GetMapping("/referenciaProducto/{ref}/paginado")
    public Page<Ubicacion> findByProductosRef(
            @PathVariable String ref,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ubicacionesRepository.findByProductosRefContainingIgnoreCaseOrderByNombreAsc(
                ref, PageRequest.of(page, size));
    }

    @GetMapping("/referenciaProducto/{ref}")
    public Iterable<Ubicacion> findByProductosRef(@PathVariable String ref) {
        return ubicacionesRepository.findByProductosRefContainingIgnoreCaseOrderByNombreAsc(ref);
    }

    @GetMapping("/descripcionProducto/{description}/paginado")
    public Page<Ubicacion> findByProductosDescription(
            @PathVariable String description,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ubicacionesRepository.findByProductosDescriptionContainingIgnoreCaseOrderByNombreAsc(
                description, PageRequest.of(page, size));
    }

    @GetMapping("/descripcionProducto/{description}")
    public Iterable<Ubicacion> findByProductosDescription(@PathVariable String description) {
        return ubicacionesRepository.findByProductosDescriptionContainingIgnoreCaseOrderByNombreAsc(description);
    }

    /**
     * Al sumar productos a una ubicación, se:
     * - Para productos normales: se comprueba si ya existe en la ubicación y se
     * suman las unidades.
     * - Para productos especiales ("VISUAL" o "SIN REFERENCIA"): se añade una nueva
     * entrada y se crea un nuevo producto en el microservicio de Productos.
     */
    @PostMapping("/sumar")
    public Ubicacion sumarUbicacion(@RequestBody Ubicacion ubicacion, @RequestHeader("Authorization") String token) {
        System.out.println("=== ENDPOINT /ubicaciones/sumar LLAMADO ===");
        System.out.println("Ubicación recibida: " + (ubicacion != null ? ubicacion.getNombre() : "null"));
        System.out.println("Token recibido: " + (token != null ? "Presente" : "Ausente"));

        if (ubicacion != null && ubicacion.getProductos() != null) {
            System.out.println("Productos en ubicación: " + ubicacion.getProductos().size());
            ubicacion.getProductos().forEach(p -> System.out.println(
                    "  - Producto: " + p.getRef() + " | Estado: " + p.getEstado() + " | Unidades: " + p.getUnidades()));
        }

        try {
            Ubicacion resultado = procesarSumaUbicacion(ubicacion, token);
            System.out.println("Ubicación procesada exitosamente: " + resultado.getNombre());
            return resultado;
        } catch (Exception e) {
            System.err.println("Error al procesar ubicación: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Lógica principal para procesar suma de productos en ubicaciones.
     * Maneja tanto productos nuevos como existentes correctamente.
     */
    private Ubicacion procesarSumaUbicacion(Ubicacion ubicacion, String token) {
        Ubicacion ubiAux = ubicacionesRepository.findByNombre(ubicacion.getNombre()).orElse(null);

        if (ubiAux != null) {
            System.out.println("Ubicación existente encontrada: " + ubiAux.getNombre());
            System.out.println("Productos actuales en ubicación: " + ubiAux.getProductos().size());

            for (ProductoUbicacion nuevoProducto : ubicacion.getProductos()) {
                System.out.println("Procesando: " + nuevoProducto.getRef() + " | Estado: " + nuevoProducto.getEstado()
                        + " | Unidades: " + nuevoProducto.getUnidades());

                if (esProductoEspecial(nuevoProducto)) {
                    // Productos especiales no tienen estado, mantener lógica original
                    if (token != null) {
                        addProductoEspecial(nuevoProducto, token);
                    }
                    ubiAux.getProductos().add(nuevoProducto);
                    System.out.println("✅ Producto especial agregado: " + nuevoProducto.getRef());
                } else {
                    // Producto normal: buscar por referencia Y estado (considerando nulos)
                    ProductoUbicacion productoExistente = ubiAux.getProductos()
                            .stream()
                            .filter(p -> p.getRef().equals(nuevoProducto.getRef()) &&
                                    Objects.equals(p.getEstado(), nuevoProducto.getEstado()))
                            .findFirst()
                            .orElse(null);

                    if (productoExistente != null) {
                        // PRODUCTO EXISTE: SUMAR unidades
                        int unidadesAntes = productoExistente.getUnidades();
                        int unidadesASumar = nuevoProducto.getUnidades();
                        int unidadesDespues = unidadesAntes + unidadesASumar;

                        productoExistente.setUnidades(unidadesDespues);

                        System.out.println("✅ PRODUCTO EXISTENTE - UNIDADES SUMADAS:");
                        System.out.println("   Ref: " + productoExistente.getRef() + " | Estado: "
                                + productoExistente.getEstado());
                        System.out.println("   Antes: " + unidadesAntes + " + Sumando: " + unidadesASumar
                                + " = Después: " + unidadesDespues);
                    } else {
                        // PRODUCTO NO EXISTE: AGREGAR nuevo
                        ubiAux.getProductos().add(nuevoProducto);
                        System.out.println("✅ PRODUCTO NUEVO AGREGADO: " + nuevoProducto.getRef() + " | Estado: "
                                + nuevoProducto.getEstado() + " | Unidades: " + nuevoProducto.getUnidades());
                    }
                }
            }

            // Actualizar stock en microservicio de productos solo si hay token
            if (token != null) {
                for (ProductoUbicacion p : ubicacion.getProductos()) {
                    if (!esProductoEspecial(p)) {
                        try {
                            sumarStockProductoNormalConEstado(p, token);
                        } catch (Exception e) {
                            System.err.println("Error al actualizar stock en productos para " + p.getRef() + ": "
                                    + e.getMessage());
                            // No detener el proceso por errores de stock
                        }
                    }
                }
            } else {
                System.out.println("Sin token - saltando actualización de stock en microservicio de productos");
            }

            return ubicacionesRepository.save(ubiAux);
        } else {
            // Ubicación nueva
            System.out.println("Ubicación nueva, creando: " + ubicacion.getNombre());

            if (token != null) {
                for (ProductoUbicacion nuevoProducto : ubicacion.getProductos()) {
                    if (esProductoEspecial(nuevoProducto)) {
                        try {
                            addProductoEspecial(nuevoProducto, token);
                        } catch (Exception e) {
                            System.err.println("Error al crear producto especial: " + e.getMessage());
                        }
                    }
                }
                for (ProductoUbicacion p : ubicacion.getProductos()) {
                    if (!esProductoEspecial(p)) {
                        try {
                            sumarStockProductoNormalConEstado(p, token);
                        } catch (Exception e) {
                            System.err.println("Error al actualizar stock para producto nuevo: " + e.getMessage());
                        }
                    }
                }
            }
            return ubicacionesRepository.save(ubicacion);
        }
    }

    @PostMapping("/restar")
    public ResponseEntity<?> restarUbicacion(@RequestBody Ubicacion ubicacion,
            @RequestHeader("Authorization") String token) {
        try {
            System.out.println("=== INICIO RESTAR UBICACIÓN ===");
            System.out.println("Token recibido: " + (token != null ? "Presente" : "Ausente"));
            System.out.println("Ubicación: " + ubicacion.getNombre());

            Ubicacion ubiAux = ubicacionesRepository.findByNombre(ubicacion.getNombre()).orElse(null);

            if (ubiAux != null) {
                // SOLUCIÓN: Agrupar productos especiales por descripción antes de procesarlos
                Map<String, Integer> productosEspecialesAgrupados = new HashMap<>();

                for (ProductoUbicacion prodRestar : ubicacion.getProductos()) {
                    if (esProductoEspecial(prodRestar)) {
                        String descripcion = prodRestar.getDescription();
                        productosEspecialesAgrupados.merge(descripcion, prodRestar.getUnidades(), Integer::sum);
                    }
                }

                // Procesar productos especiales agrupados
                for (Map.Entry<String, Integer> entry : productosEspecialesAgrupados.entrySet()) {
                    String descripcion = entry.getKey();
                    Integer totalUnidades = entry.getValue();

                    ProductoUbicacion prodExistente = ubiAux.getProductos()
                            .stream()
                            .filter(p -> p.getDescription() != null && p.getDescription().equals(descripcion))
                            .findFirst()
                            .orElse(null);

                    if (prodExistente == null) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("No se encontró el producto especial '" + descripcion + "' en la ubicación");
                    }

                    if (prodExistente.getUnidades() < totalUnidades) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("No hay unidades suficientes del producto especial '" + descripcion +
                                        "' (Disponible: " + prodExistente.getUnidades() + ", Solicitado: "
                                        + totalUnidades + ")");
                    }

                    // Actualizar unidades en ubicación
                    if (prodExistente.getUnidades() - totalUnidades == 0) {
                        ubiAux.getProductos().remove(prodExistente);
                    } else {
                        prodExistente.setUnidades(prodExistente.getUnidades() - totalUnidades);
                    }

                    // Restar stock en microservicio de productos (UNA SOLA VEZ por descripción)
                    ProductoUbicacion prodParaRestar = new ProductoUbicacion();
                    prodParaRestar.setRef(prodExistente.getRef());
                    prodParaRestar.setDescription(descripcion);
                    prodParaRestar.setUnidades(totalUnidades);

                    try {
                        restarStockProductoEspecial(prodParaRestar, token);
                        System.out.println(
                                "✅ Stock especial restado para: " + descripcion + " - " + totalUnidades + " unidades");
                    } catch (Exception e) {
                        System.err.println(
                                "Error al restar stock especial para '" + descripcion + "': " + e.getMessage());
                        // Continuar procesando otros productos en lugar de fallar completamente
                    }
                }

                // Procesar productos normales (sin cambios en la lógica)
                for (ProductoUbicacion prodRestar : ubicacion.getProductos()) {
                    if (!esProductoEspecial(prodRestar)) {
                        // Producto normal: buscar por referencia Y estado
                        ProductoUbicacion prodExistente = ubiAux.getProductos()
                                .stream()
                                .filter(p -> p.getRef().equals(prodRestar.getRef()) &&
                                        Objects.equals(p.getEstado(), prodRestar.getEstado()))
                                .findFirst()
                                .orElse(null);

                        if (prodExistente != null) {
                            if (prodExistente.getUnidades() - prodRestar.getUnidades() < 0) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body("No hay unidades suficientes del producto con referencia "
                                                + prodRestar.getRef() + " y estado " + prodRestar.getEstado());
                            } else if ((prodExistente.getUnidades() - prodRestar.getUnidades()) == 0) {
                                ubiAux.getProductos().remove(prodExistente);
                            } else {
                                prodExistente.setUnidades(prodExistente.getUnidades() - prodRestar.getUnidades());
                            }

                            // Restar stock en microservicio
                            try {
                                restarStockProductoNormalConEstado(prodRestar, token);
                            } catch (Exception e) {
                                System.err.println("Error al restar stock normal para " + prodRestar.getRef() + ": "
                                        + e.getMessage());
                            }
                        } else {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("No hay unidades del producto con referencia " + prodRestar.getRef()
                                            + " y estado " + prodRestar.getEstado() + " en la ubicación");
                        }
                    }
                }

                return ResponseEntity.ok(ubicacionesRepository.save(ubiAux));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("No existe la ubicación: " + ubicacion.getNombre());
            }
        } catch (Exception e) {
            System.err.println("Error general al procesar restar ubicación: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al procesar la solicitud: " + e.getMessage());
        }
    }

    @PostMapping("/reubicar")
    public ResponseEntity<?> reubicarProducto(@RequestBody ReubicacionRequest request) {
        // Validar que se hayan enviado las ubicaciones y el producto
        if ((request.getOrigen() == null || request.getOrigen().isEmpty()) || request.getOrigen().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La ubicación de origen es obligatoria.");
        }
        if ((request.getDestino() == null || request.getDestino().isEmpty()) || request.getDestino().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La ubicación destino es obligatoria.");
        }
        if (request.getProducto() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("El producto a reubicar es obligatorio.");
        }
        if (request.getProducto().getUnidades() == null || request.getProducto().getUnidades() <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("El número de unidades a reubicar debe ser mayor a 0.");
        }

        // Recuperar ubicaciones
        Ubicacion origen = ubicacionesRepository.findByNombre(request.getOrigen()).orElse(null);
        if (origen == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La ubicación de origen no puede estar vacía");
        }

        Ubicacion destino = ubicacionesRepository.findByNombre(request.getDestino()).orElse(null);
        if (destino == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La ubicación destino no puede estar vacía");
        }

        ProductoUbicacion productoRequest = request.getProducto();
        boolean esEspecial = esProductoEspecial(productoRequest);

        // Buscar el producto en la ubicación de origen
        ProductoUbicacion prodOrigen;
        if (esEspecial) {
            prodOrigen = origen.getProductos().stream()
                    .filter(p -> p.getDescription() != null
                            && p.getDescription().equals(productoRequest.getDescription()))
                    .findFirst().orElse(null);
        } else {
            // Para productos normales, buscar por referencia Y estado
            prodOrigen = origen.getProductos().stream()
                    .filter(p -> p.getRef() != null && p.getRef().equals(productoRequest.getRef()) &&
                            Objects.equals(p.getEstado(), productoRequest.getEstado()))
                    .findFirst().orElse(null);
        }

        if (prodOrigen == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("El producto no existe en la ubicación de origen: " + request.getOrigen());
        }

        // Validar stock suficiente
        if (prodOrigen.getUnidades() < productoRequest.getUnidades()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("No hay unidades suficientes en la ubicación de origen '" + origen.getNombre()
                            + "' para el producto.");
        }

        // Realizar la resta en la ubicación de origen
        int unidadesRestantes = prodOrigen.getUnidades() - productoRequest.getUnidades();
        if (unidadesRestantes == 0) {
            // Se elimina la entrada completamente
            origen.getProductos().remove(prodOrigen);
        } else {
            prodOrigen.setUnidades(unidadesRestantes);
        }

        // Procesar la suma en la ubicación de destino
        if (destino.getProductos() == null) {
            destino.setProductos(new HashSet<>());
        }

        ProductoUbicacion prodDestino = null;
        if (esEspecial) {
            prodDestino = destino.getProductos().stream()
                    .filter(p -> p.getDescription() != null
                            && p.getDescription().equals(productoRequest.getDescription()))
                    .findFirst().orElse(null);
        } else {
            // Para productos normales, buscar por referencia Y estado (mantener el estado
            // original)
            prodDestino = destino.getProductos().stream()
                    .filter(p -> p.getRef() != null && p.getRef().equals(productoRequest.getRef()) &&
                            Objects.equals(p.getEstado(), prodOrigen.getEstado()))
                    .findFirst().orElse(null);
        }

        if (prodDestino != null) {
            // Sumar unidades a la entrada existente
            prodDestino.setUnidades(prodDestino.getUnidades() + productoRequest.getUnidades());
        } else {
            // Crear nueva entrada manteniendo el estado original
            ProductoUbicacion nuevoProducto = new ProductoUbicacion();
            nuevoProducto.setRef(productoRequest.getRef());
            nuevoProducto.setDescription(productoRequest.getDescription());
            nuevoProducto.setUnidades(productoRequest.getUnidades());

            // IMPORTANTE: Mantener el estado del producto original
            if (!esEspecial) {
                nuevoProducto.setEstado(prodOrigen.getEstado());
            }

            destino.getProductos().add(nuevoProducto);
        }

        // Guardar cambios
        ubicacionesRepository.save(origen);
        ubicacionesRepository.save(destino);

        return ResponseEntity.ok("Producto reubicado correctamente.");
    }

    @PutMapping("/productos/updateDescripcion")
    public ResponseEntity<?> actualizarDescripcionProducto(@RequestBody ProductoDescripcionUpdateDTO dto) {
        // Determinar si es producto especial utilizando el ref (el método
        // esProductoEspecial usa el campo ref)
        boolean esEspecial = esProductoEspecial(new ProductoUbicacion() {
            {
                setRef(dto.getRef());
            }
        });

        // Obtener las ubicaciones afectadas:
        List<Ubicacion> ubicaciones;
        if (esEspecial) {
            // Para productos especiales, buscamos por la descripción antigua
            ubicaciones = (List<Ubicacion>) ubicacionesRepository
                    .findByProductosDescriptionContainingIgnoreCaseOrderByNombreAsc(dto.getOldDescription());
        } else {
            // Para productos normales, buscamos por referencia
            ubicaciones = (List<Ubicacion>) ubicacionesRepository
                    .findByProductosRefContainingIgnoreCaseOrderByNombreAsc(dto.getRef());
        }

        if (ubicaciones.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encontraron ubicaciones con el producto a actualizar.");
        }

        // Recorrer cada ubicación y actualizar la descripción de los productos que
        // cumplan la condición
        for (Ubicacion ubi : ubicaciones) {
            // Usamos iterator para evitar ConcurrentModificationException al eliminar
            Iterator<ProductoUbicacion> it = ubi.getProductos().iterator();
            while (it.hasNext()) {
                ProductoUbicacion pu = it.next();
                if (!esEspecial && pu.getRef() != null && pu.getRef().equals(dto.getRef())) {
                    pu.setDescription(dto.getNewDescription());
                } else if (esEspecial && pu.getDescription() != null
                        && pu.getDescription().equals(dto.getOldDescription())) {
                    pu.setDescription(dto.getNewDescription());
                }
                // Si tras la actualización (o en cualquier operación) las unidades son 0, se
                // elimina
                if (pu.getUnidades() != null && pu.getUnidades() == 0) {
                    it.remove();
                }
            }
            ubicacionesRepository.save(ubi);
        }
        return ResponseEntity.ok("Descripción del producto actualizada en las ubicaciones afectadas.");
    }

    // ----- Métodos auxiliares en UbicacionesController -----

    private boolean esProductoEspecial(ProductoUbicacion pu) {
        if (pu.getRef() == null)
            return false;
        // Quitar espacios y pasar a mayúsculas
        String r = pu.getRef().replaceAll("\\s+", "").toUpperCase();
        return "VISUAL".equals(r) || "SINREFERENCIA".equals(r);
    }

    /**
     * Llama al endpoint del microservicio Productos para crear un producto
     * especial.
     */
    private Producto addProductoEspecial(ProductoUbicacion productoUbicacion, String token) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://localhost:8091/productos/especial";

        // Configurar encabezados con el token
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        // Se construye un objeto Producto a partir de ProductoUbicacion
        Producto producto = new Producto();
        producto.setReferencia(productoUbicacion.getRef());
        producto.setDescription(productoUbicacion.getDescription());
        producto.setStock(productoUbicacion.getUnidades());

        HttpEntity<Producto> requestEntity = new HttpEntity<>(producto, headers);
        ResponseEntity<Producto> response = restTemplate.postForEntity(url, requestEntity, Producto.class);

        return response.getBody();
    }

    /**
     * Actualiza stock para productos normales (suma).
     */
    private void sumarStockProductoNormal(ProductoUbicacion productoUbicacion, String token) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://localhost:8091/productos/" + productoUbicacion.getRef() + "/sumar";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        HttpEntity<Integer> requestEntity = new HttpEntity<>(productoUbicacion.getUnidades(), headers);

        restTemplate.exchange(
                url,
                HttpMethod.PUT,
                requestEntity,
                Producto.class);
    }

    /**
     * Actualiza stock para productos normales (resta).
     */
    private void restarStockProductoNormal(ProductoUbicacion productoUbicacion, String token) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://localhost:8091/productos/" + productoUbicacion.getRef() + "/restar";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        HttpEntity<Integer> requestEntity = new HttpEntity<>(productoUbicacion.getUnidades(), headers);

        restTemplate.exchange(
                url,
                HttpMethod.PUT,
                requestEntity,
                Producto.class);
    }

    /**
     * Llama al endpoint de Productos para restar stock de un producto especial
     * (usando el productoId).
     */
    private void restarStockProductoEspecial(ProductoUbicacion productoUbicacion, String token) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url;

            if ("VISUAL".equals(productoUbicacion.getRef())) {
                url = "http://localhost:8091/productos/visual/restarEspecial/" + productoUbicacion.getDescription();
            } else if ("SIN REFERENCIA".equals(productoUbicacion.getRef())) {
                url = "http://localhost:8091/productos/sinreferencia/restarEspecial/"
                        + productoUbicacion.getDescription();
            } else {
                System.err.println("Tipo de producto especial no reconocido: " + productoUbicacion.getRef());
                return;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", token);
            headers.set("Content-Type", "application/json");

            HttpEntity<Integer> requestEntity = new HttpEntity<>(productoUbicacion.getUnidades(), headers);

            System.out.println("Llamando a URL: " + url);
            System.out.println("Unidades a restar: " + productoUbicacion.getUnidades());

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    requestEntity,
                    String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("Stock especial restado exitosamente para: " + productoUbicacion.getRef() + " - "
                        + productoUbicacion.getDescription());
            } else {
                System.err.println("Error al restar stock especial. Status: " + response.getStatusCode());
            }

        } catch (HttpClientErrorException e) {
            System.err.println(
                    "Error HTTP al restar stock especial: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            throw new RuntimeException("Error al restar stock del producto especial: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error general al restar stock especial: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al restar stock del producto especial: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
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

    @PutMapping("/transferir-estado")
    public ResponseEntity<?> transferirEstadoEnUbicacion(@RequestBody TransferirEstadoUbicacionDTO dto,
            @RequestHeader("Authorization") String token) {
        try {
            System.out.println("=== TRANSFERENCIA DE ESTADO EN UBICACIÓN ===");
            System.out.println("DTO recibido: " + dto.getReferencia() + " - " + dto.getEstadoOrigen() + " -> "
                    + dto.getEstadoDestino());

            // Buscar la ubicación
            Ubicacion ubicacion = ubicacionesRepository.findByNombre(dto.getUbicacionNombre()).orElse(null);
            if (ubicacion == null) {
                return ResponseEntity.badRequest().body("Ubicación no encontrada: " + dto.getUbicacionNombre());
            }

            String estadoOrigenBuscar = dto.getEstadoOrigen();
            String estadoDestinoBuscar = dto.getEstadoDestino();

            System.out.println("Productos en ubicación antes de transferencia: " + ubicacion.getProductos().size());
            ubicacion.getProductos().forEach(p -> System.out.println("  - " + p.getRef() + " | Estado: " + p.getEstado()
                    + " | Unidades: " + p.getUnidades() + " | ID: " + p.getId()));

            // Buscar el producto origen en la ubicación
            ProductoUbicacion productoOrigen = ubicacion.getProductos().stream()
                    .filter(p -> p.getRef().equals(dto.getReferencia()) &&
                            Objects.equals(p.getEstado(), estadoOrigenBuscar))
                    .findFirst()
                    .orElse(null);

            if (productoOrigen == null) {
                System.out.println("No se encontró producto origen");
                return ResponseEntity.badRequest()
                        .body("No se encontró producto con referencia " + dto.getReferencia() +
                                " y estado " + ((dto.getEstadoOrigen() == null || dto.getEstadoOrigen().isEmpty()) ? "SIN ESTADO" : dto.getEstadoOrigen())
                                + " en la ubicación");
            }

            System.out.println("Producto origen encontrado - ID: " + productoOrigen.getId() + ", Unidades: "
                    + productoOrigen.getUnidades());

            // Verificar stock suficiente
            if (productoOrigen.getUnidades() < dto.getCantidad()) {
                return ResponseEntity.badRequest()
                        .body("Stock insuficiente. Stock actual: " + productoOrigen.getUnidades());
            }

            // Buscar o crear producto destino en la misma ubicación
            ProductoUbicacion productoDestino = ubicacion.getProductos().stream()
                    .filter(p -> p.getRef().equals(dto.getReferencia()) &&
                            Objects.equals(p.getEstado(), estadoDestinoBuscar))
                    .findFirst()
                    .orElse(null);

            if (productoDestino == null) {
                System.out.println("Creando nuevo producto con estado destino");
                productoDestino = new ProductoUbicacion();
                productoDestino.setRef(dto.getReferencia());
                productoDestino.setDescription(productoOrigen.getDescription());
                productoDestino.setEstado(estadoDestinoBuscar);
                productoDestino.setUnidades(0);
                ubicacion.getProductos().add(productoDestino);
            } else {
                System.out.println("Producto destino ya existe - ID: " + productoDestino.getId() + ", Unidades: "
                        + productoDestino.getUnidades());
            }

            // IMPORTANTE: Capturar el ID antes de modificar las unidades
            final Long idProductoAEliminar = productoOrigen.getId();

            // Actualizar cantidades
            productoOrigen.setUnidades(productoOrigen.getUnidades() - dto.getCantidad());
            productoDestino.setUnidades(productoDestino.getUnidades() + dto.getCantidad());

            System.out.println("Nuevas cantidades - Origen: " + productoOrigen.getUnidades() + ", Destino: "
                    + productoDestino.getUnidades());

            // Eliminar producto origen si queda sin stock usando removeIf()
            boolean productoEliminado = false;
            if (productoOrigen.getUnidades() == 0) {
                System.out.println("Eliminando producto origen por stock 0");
                System.out.println("ID del producto a eliminar: " + idProductoAEliminar);

                // Usar removeIf() con el ID para eliminar de forma segura
                productoEliminado = ubicacion.getProductos()
                        .removeIf(p -> p.getId() != null && p.getId().equals(idProductoAEliminar));

                System.out.println("Producto eliminado del Set: " + productoEliminado);
                System.out.println("Productos restantes en ubicación: " + ubicacion.getProductos().size());
            }

            // Llamar al microservicio de productos para actualizar el stock
            TransferirEstadoDTO dtoProductos = new TransferirEstadoDTO();
            dtoProductos.setReferencia(dto.getReferencia());
            dtoProductos.setEstadoOrigen(dto.getEstadoOrigen());
            dtoProductos.setEstadoDestino(dto.getEstadoDestino());
            dtoProductos.setCantidad(dto.getCantidad());

            System.out.println("Llamando al microservicio de productos");
            transferirEstadoEnProductos(dtoProductos, token);

            // Guardar cambios en ubicación
            Ubicacion ubicacionGuardada = ubicacionesRepository.save(ubicacion);
            System.out.println("Ubicación guardada correctamente");

            // Verificar que se guardó correctamente
            System.out.println("Productos en ubicación después de guardar: " + ubicacionGuardada.getProductos().size());
            ubicacionGuardada.getProductos().forEach(p -> System.out.println("  - " + p.getRef() + " | Estado: "
                    + p.getEstado() + " | Unidades: " + p.getUnidades() + " | ID: " + p.getId()));

            return ResponseEntity.ok("Transferencia de estado realizada correctamente en la ubicación");

        } catch (Exception e) {
            System.err.println("=== ERROR EN TRANSFERENCIA ===");
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al transferir estado: " + e.getMessage());
        }
    }

    // NUEVO ENDPOINT para eliminar grupo completo de productos
    @DeleteMapping("/productos/grupo/{referencia}")
    public ResponseEntity<?> eliminarGrupoProductos(@PathVariable String referencia,
            @RequestHeader("Authorization") String token) {
        try {
            // Buscar todas las ubicaciones que contienen esta referencia
            List<Ubicacion> ubicaciones = (List<Ubicacion>) ubicacionesRepository
                    .findByProductosRefContainingIgnoreCaseOrderByNombreAsc(referencia);

            // Verificar que no hay stock en ninguna ubicación
            for (Ubicacion ubicacion : ubicaciones) {
                boolean tieneStock = ubicacion.getProductos().stream()
                        .anyMatch(p -> p.getRef().equals(referencia) && p.getUnidades() > 0);
                if (tieneStock) {
                    return ResponseEntity.badRequest()
                            .body("No se puede eliminar: existe stock en la ubicación " + ubicacion.getNombre());
                }
            }

            // Eliminar todos los productos con esa referencia de todas las ubicaciones
            for (Ubicacion ubicacion : ubicaciones) {
                ubicacion.getProductos().removeIf(p -> p.getRef().equals(referencia));
                ubicacionesRepository.save(ubicacion);
            }

            // Llamar al microservicio de productos para eliminar todos los productos con
            // esa referencia
            eliminarProductosPorReferencia(referencia, token);

            return ResponseEntity.ok("Grupo de productos eliminado correctamente");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al eliminar grupo de productos: " + e.getMessage());
        }
    }

    private void transferirEstadoEnProductos(TransferirEstadoDTO dto, String token) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://localhost:8091/productos/transferir-estado";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        HttpEntity<TransferirEstadoDTO> requestEntity = new HttpEntity<>(dto, headers);

        restTemplate.exchange(url, HttpMethod.PUT, requestEntity, String.class);
    }

    private void eliminarProductosPorReferencia(String referencia, String token) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://localhost:8091/productos/grupo/" + referencia;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        restTemplate.exchange(url, HttpMethod.DELETE, requestEntity, String.class);
    }

    private void sumarStockProductoNormalConEstado(ProductoUbicacion productoUbicacion, String token) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        headers.set("Content-Type", "application/json");

        String ref = productoUbicacion.getRef();
        String estado = productoUbicacion.getEstado();
        Integer unidades = productoUbicacion.getUnidades();

        System.out.println("Actualizando stock para: " + ref + " | Estado: " + estado + " | Unidades: " + unidades);

        // Verificar si el producto con ese estado específico existe
        String urlVerificar = "http://localhost:8091/productos/referencia/" + ref + "/estado/" + estado;

        try {
            HttpEntity<Void> verificarEntity = new HttpEntity<>(headers);
            ResponseEntity<Producto> verificarResponse = restTemplate.exchange(
                    urlVerificar,
                    HttpMethod.GET,
                    verificarEntity,
                    Producto.class);

            if (verificarResponse.getBody() != null) {
                // El producto ya existe, sumar stock usando el NUEVO endpoint específico por
                // estado
                System.out.println("Producto existe, sumando stock usando endpoint específico...");
                String urlSumar = "http://localhost:8091/productos/" + ref + "/estado/" + estado + "/sumar";
                HttpEntity<Integer> sumarEntity = new HttpEntity<>(unidades, headers);

                try {
                    ResponseEntity<Producto> sumarResponse = restTemplate.exchange(
                            urlSumar, HttpMethod.PUT, sumarEntity, Producto.class);

                    if (sumarResponse.getStatusCode().is2xxSuccessful()) {
                        System.out.println("Stock sumado exitosamente");
                    } else {
                        System.err.println("Error al sumar stock: " + sumarResponse.getStatusCode());
                    }
                } catch (Exception e) {
                    System.err.println("Error al sumar stock: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            // El producto no existe, crearlo
            System.out.println("Producto no existe, creando...");
            String urlCrear = "http://localhost:8091/productos";

            Producto producto = new Producto();
            producto.setReferencia(ref);
            producto.setDescription(productoUbicacion.getDescription());
            producto.setEstado(estado);
            producto.setStock(unidades);

            HttpEntity<Producto> crearEntity = new HttpEntity<>(producto, headers);

            try {
                ResponseEntity<Producto> crearResponse = restTemplate.postForEntity(urlCrear, crearEntity,
                        Producto.class);
                if (crearResponse.getStatusCode().is2xxSuccessful()) {
                    System.out.println("Producto creado exitosamente con estado " + estado);
                }
            } catch (HttpClientErrorException ex) {
                if (ex.getResponseBodyAsString().contains("Ya existe un producto")) {
                    System.out.println("Producto ya existe (creado por otro proceso), sumando stock...");
                    // Intentar sumar stock usando el endpoint específico
                    String urlSumar = "http://localhost:8091/productos/" + ref + "/estado/" + estado + "/sumar";
                    HttpEntity<Integer> sumarEntity = new HttpEntity<>(unidades, headers);

                    try {
                        restTemplate.exchange(urlSumar, HttpMethod.PUT, sumarEntity, Producto.class);
                        System.out.println("Stock sumado exitosamente después de detectar producto existente");
                    } catch (Exception sumException) {
                        System.err.println("Error al sumar stock después de crear: " + sumException.getMessage());
                    }
                } else {
                    System.err.println("Error al crear producto: " + ex.getMessage());
                }
            } catch (Exception ex) {
                System.err.println("Error general al crear producto: " + ex.getMessage());
            }
        }
    }

    private void restarStockProductoNormalConEstado(ProductoUbicacion productoUbicacion, String token) {
        RestTemplate restTemplate = new RestTemplate();
        String ref = productoUbicacion.getRef();
        String estado = productoUbicacion.getEstado();
        Integer unidades = productoUbicacion.getUnidades();

        // Usar el NUEVO endpoint específico por estado
        String url = "http://localhost:8091/productos/" + ref + "/estado/" + estado + "/restar";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        HttpEntity<Integer> requestEntity = new HttpEntity<>(unidades, headers);

        try {
            ResponseEntity<Producto> response = restTemplate.exchange(url, HttpMethod.PUT, requestEntity,
                    Producto.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("Stock restado exitosamente para " + ref + " estado " + estado);
            } else {
                System.err.println("Error al restar stock: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("Error al restar stock: " + e.getMessage());
        }
    }

    @GetMapping("/estado/{estado}/paginado")
    public Page<Ubicacion> getUbicacionesByEstado(
            @PathVariable String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ubicacionesRepository.findByProductosEstado(estado, PageRequest.of(page, size));
    }

    @GetMapping("/estado/{estado}")
    public Iterable<Ubicacion> getUbicacionesByEstado(@PathVariable String estado) {
        return ubicacionesRepository.findByProductosEstado(estado);
    }

    @GetMapping("/referencia/{referencia}/estado/{estado}/paginado")
    public Page<Ubicacion> getUbicacionesByReferenciaAndEstado(
            @PathVariable String referencia,
            @PathVariable String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ubicacionesRepository.findByProductosRefAndEstado(referencia, estado, PageRequest.of(page, size));
    }

    @GetMapping("/referencia/{referencia}/estado/{estado}")
    public Iterable<Ubicacion> getUbicacionesByReferenciaAndEstado(
            @PathVariable String referencia,
            @PathVariable String estado) {
        return ubicacionesRepository.findByProductosRefAndEstado(referencia, estado);
    }

    @PutMapping("/productos/migrar-estado")
    public ResponseEntity<?> migrarEstadoEnUbicaciones(@RequestBody MigrarEstadoUbicacionDTO dto) {
        try {
            System.out.println("=== INICIO MIGRACIÓN UBICACIONES ===");
            System.out.println("Referencia: " + dto.getReferencia());
            System.out.println("Estado destino: " + dto.getEstadoDestino());

            // Buscar todas las ubicaciones que contienen productos con esa referencia y
            // estado null
            List<Ubicacion> ubicaciones = (List<Ubicacion>) ubicacionesRepository
                    .findByProductosRefContainingIgnoreCaseOrderByNombreAsc(dto.getReferencia());

            System.out.println("Ubicaciones encontradas: " + ubicaciones.size());

            int productosActualizados = 0;

            for (Ubicacion ubicacion : ubicaciones) {
                System.out.println("Procesando ubicación: " + ubicacion.getNombre());
                boolean ubicacionModificada = false;

                // Buscar productos sin estado con esa referencia
                List<ProductoUbicacion> productosSinEstado = ubicacion.getProductos().stream()
                        .filter(p -> p.getRef().equals(dto.getReferencia())
                                && (p.getEstado() == null || p.getEstado().isEmpty()))
                        .collect(Collectors.toList());

                System.out.println("Productos sin estado encontrados: " + productosSinEstado.size());

                for (ProductoUbicacion productoSinEstado : productosSinEstado) {
                    System.out.println("Procesando producto: " + productoSinEstado.getRef() + " - "
                            + productoSinEstado.getUnidades() + " unidades");

                    // Buscar si ya existe un producto con el estado destino en la misma ubicación
                    ProductoUbicacion productoConEstado = ubicacion.getProductos().stream()
                            .filter(p -> p.getRef().equals(dto.getReferencia()) &&
                                    dto.getEstadoDestino().equals(p.getEstado()))
                            .findFirst()
                            .orElse(null);

                    if (productoConEstado != null) {
                        System.out.println("Producto con estado destino ya existe, sumando unidades");
                        // Sumar las unidades al producto existente con estado
                        productoConEstado
                                .setUnidades(productoConEstado.getUnidades() + productoSinEstado.getUnidades());
                        // Eliminar el producto sin estado
                        ubicacion.getProductos().remove(productoSinEstado);
                    } else {
                        System.out.println("Asignando estado al producto existente");
                        // Asignar el estado al producto existente
                        productoSinEstado.setEstado(dto.getEstadoDestino());
                    }

                    productosActualizados++;
                    ubicacionModificada = true;
                }

                // Guardar la ubicación solo si se modificó
                if (ubicacionModificada) {
                    System.out.println("Guardando ubicación modificada: " + ubicacion.getNombre());
                    ubicacionesRepository.save(ubicacion);
                }
            }

            String mensaje = "Migración completada. " + productosActualizados +
                    " productos actualizados en ubicaciones.";
            System.out.println("=== FIN MIGRACIÓN UBICACIONES: " + mensaje + " ===");

            return ResponseEntity.ok(mensaje);

        } catch (Exception e) {
            System.err.println("=== ERROR EN MIGRACIÓN UBICACIONES ===");
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al migrar estado en ubicaciones: " + e.getMessage());
        }
    }

    @GetMapping("/descripcionProducto/{description}/estado/{estado}/paginado")
    public Page<Ubicacion> findByProductosDescriptionAndEstado(
            @PathVariable String description,
            @PathVariable String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ubicacionesRepository.findByProductosDescriptionContainingIgnoreCaseAndEstado(
                description, estado, PageRequest.of(page, size));
    }

    @GetMapping("/descripcionProducto/{description}/estado/{estado}")
    public Iterable<Ubicacion> findByProductosDescriptionAndEstado(
            @PathVariable String description,
            @PathVariable String estado) {
        return ubicacionesRepository.findByProductosDescriptionContainingIgnoreCaseAndEstado(description, estado);
    }

    // Búsqueda por referencia y estado (mejorado)
    @GetMapping("/referenciaProducto/{ref}/estado/{estado}/paginado")
    public Page<Ubicacion> findByProductosRefAndEstado(
            @PathVariable String ref,
            @PathVariable String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ubicacionesRepository.findByProductosRefContainingIgnoreCaseAndEstado(
                ref, estado, PageRequest.of(page, size));
    }

    @GetMapping("/referenciaProducto/{ref}/estado/{estado}")
    public Iterable<Ubicacion> findByProductosRefAndEstado(
            @PathVariable String ref,
            @PathVariable String estado) {
        return ubicacionesRepository.findByProductosRefContainingIgnoreCaseAndEstado(ref, estado);
    }

    @PostMapping("/actualizar-estado")
    public ResponseEntity<?> actualizarEstado(@RequestBody CambioEstadoRequest request) {
        try {
            int productosActualizados = 0;
            Iterable<Ubicacion> ubicaciones = ubicacionesRepository.findAll();

            for (Ubicacion ubicacion : ubicaciones) {
                boolean huboCambios = false;
                for (ProductoUbicacion producto : ubicacion.getProductos()) {
                    if (request.getNombreAnterior().equals(producto.getEstado())) {
                        producto.setEstado(request.getNombreNuevo());
                        productosActualizados++;
                        huboCambios = true;
                    }
                }
                if (huboCambios) {
                    ubicacionesRepository.save(ubicacion);
                }
            }

            return ResponseEntity.ok("Estados actualizados en ubicaciones: " + productosActualizados + " productos");
        } catch (Exception e) {
            System.err.println("Error actualizando estados en ubicaciones: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error actualizando estados en ubicaciones");
        }
    }

    @GetMapping("/verificar-estado/{estado}")
    public ResponseEntity<Boolean> verificarEstadoEnUso(@PathVariable String estado) {
        try {
            Iterable<Ubicacion> ubicaciones = ubicacionesRepository.findAll();

            for (Ubicacion ubicacion : ubicaciones) {
                for (ProductoUbicacion producto : ubicacion.getProductos()) {
                    if (estado.equals(producto.getEstado())) {
                        return ResponseEntity.ok(true);
                    }
                }
            }

            return ResponseEntity.ok(false);
        } catch (Exception e) {
            System.err.println("Error verificando estado en ubicaciones: " + e.getMessage());
            return ResponseEntity.ok(true); // Ser conservador en caso de error
        }
    }
}