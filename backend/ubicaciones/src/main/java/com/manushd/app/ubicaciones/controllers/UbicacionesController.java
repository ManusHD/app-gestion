package com.manushd.app.ubicaciones.controllers;

import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
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
import org.springframework.web.client.RestTemplate;

import com.manushd.app.ubicaciones.models.Ubicacion;
import com.manushd.app.ubicaciones.models.ProductoUbicacion;
import com.manushd.app.ubicaciones.models.ReubicacionRequest;
import com.manushd.app.ubicaciones.models.TransferirEstadoDTO;
import com.manushd.app.ubicaciones.models.TransferirEstadoUbicacionDTO;
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
        Ubicacion ubiAux = ubicacionesRepository.findByNombre(ubicacion.getNombre()).orElse(null);

        if (ubiAux != null) {
            for (ProductoUbicacion nuevoProducto : ubicacion.getProductos()) {
                if (esProductoEspecial(nuevoProducto)) {
                    // Productos especiales no tienen estado, mantener lógica original
                    addProductoEspecial(nuevoProducto, token);
                    ubiAux.getProductos().add(nuevoProducto);
                } else {
                    // Producto normal: buscar por referencia Y estado (considerando nulos)
                    ProductoUbicacion productoExistente = ubiAux.getProductos()
                            .stream()
                            .filter(p -> p.getRef().equals(nuevoProducto.getRef()) &&
                                    Objects.equals(p.getEstado(), nuevoProducto.getEstado()))
                            .findFirst()
                            .orElse(null);

                    if (productoExistente != null) {
                        productoExistente.setUnidades(productoExistente.getUnidades() + nuevoProducto.getUnidades());
                    } else {
                        ubiAux.getProductos().add(nuevoProducto);
                    }
                }
            }

            // Actualizar stock en microservicio de productos
            for (ProductoUbicacion p : ubicacion.getProductos()) {
                if (!esProductoEspecial(p)) {
                    sumarStockProductoNormalConEstado(p, token);
                }
            }
            return ubicacionesRepository.save(ubiAux);
        } else {
            // Ubicación nueva
            for (ProductoUbicacion nuevoProducto : ubicacion.getProductos()) {
                if (esProductoEspecial(nuevoProducto)) {
                    addProductoEspecial(nuevoProducto, token);
                }
            }
            for (ProductoUbicacion p : ubicacion.getProductos()) {
                if (!esProductoEspecial(p)) {
                    sumarStockProductoNormalConEstado(p, token);
                }
            }
            return ubicacionesRepository.save(ubicacion);
        }
    }

    // MODIFICAR método restarUbicacion para considerar estados
    @PostMapping("/restar")
    public ResponseEntity<?> restarUbicacion(@RequestBody Ubicacion ubicacion,
            @RequestHeader("Authorization") String token) {
        try {
            Ubicacion ubiAux = ubicacionesRepository.findByNombre(ubicacion.getNombre()).orElse(null);

            if (ubiAux != null) {
                for (ProductoUbicacion prodRestar : ubicacion.getProductos()) {
                    if (esProductoEspecial(prodRestar)) {
                        // Lógica original para productos especiales
                        ProductoUbicacion prodExistente = ubiAux.getProductos()
                                .stream()
                                .filter(p -> p.getDescription() != null
                                        && p.getDescription().equals(prodRestar.getDescription()))
                                .findFirst()
                                .orElse(null);

                        if (prodExistente == null) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("No se encontró el producto especial en la ubicación");
                        }
                        if (prodExistente.getUnidades() - prodRestar.getUnidades() < 0) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("No hay unidades suficientes del producto especial");
                        } else if (prodExistente.getUnidades() - prodRestar.getUnidades() == 0) {
                            ubiAux.getProductos().remove(prodExistente);
                        } else {
                            prodExistente.setUnidades(prodExistente.getUnidades() - prodRestar.getUnidades());
                        }
                    } else {
                        // Producto normal: buscar por referencia Y estado
                        ProductoUbicacion prodExistente = ubiAux.getProductos()
                                .stream()
                                .filter(p -> p.getRef().equals(prodRestar.getRef()) &&
                                        p.getEstado().equals(prodRestar.getEstado()))
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
                        } else {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("No hay unidades del producto con referencia " + prodRestar.getRef()
                                            + " y estado " + prodRestar.getEstado() + " en la ubicación");
                        }
                    }
                }

                // Actualizar stock en microservicio de productos
                for (ProductoUbicacion p : ubicacion.getProductos()) {
                    if (esProductoEspecial(p)) {
                        restarStockProductoEspecial(p, token);
                    } else {
                        restarStockProductoNormalConEstado(p, token);
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

    @PostMapping("/reubicar")
    public ResponseEntity<?> reubicarProducto(@RequestBody ReubicacionRequest request) {
        // Validar que se hayan enviado las ubicaciones y el producto
        if (request.getOrigen() == null || request.getOrigen().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La ubicación de origen es obligatoria.");
        }
        if (request.getDestino() == null || request.getDestino().isBlank()) {
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

        // Recuperar la ubicación de origen
        Ubicacion origen = ubicacionesRepository.findByNombre(request.getOrigen()).orElse(null);
        if (origen == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La ubicación de origen no puede estar vacía");
        }

        // Recuperar la ubicación de destino
        Ubicacion destino = ubicacionesRepository.findByNombre(request.getDestino()).orElse(null);
        if (destino == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La ubicación destino no puede estar vacía");
        }

        // Determinar si el producto es especial o normal
        ProductoUbicacion productoRequest = request.getProducto();
        boolean esEspecial = esProductoEspecial(productoRequest);

        // Buscar el producto en la ubicación de origen
        ProductoUbicacion prodOrigen = null;
        if (esEspecial) {
            // Para productos especiales se busca por description (comparación exacta)
            prodOrigen = origen.getProductos().stream()
                    .filter(p -> p.getDescription() != null
                            && p.getDescription().equals(productoRequest.getDescription()))
                    .findFirst().orElse(null);
        } else {
            // Para productos normales se busca por ref
            prodOrigen = origen.getProductos().stream()
                    .filter(p -> p.getRef() != null && p.getRef().equals(productoRequest.getRef()))
                    .findFirst().orElse(null);
        }

        if (prodOrigen == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("El producto no existe en la ubicación de origen: " + request.getOrigen());
        }

        // Validar que la ubicación de origen tenga suficientes unidades
        if (prodOrigen.getUnidades() < productoRequest.getUnidades()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("No hay unidades suficientes en la ubicación de origen '" + origen.getNombre()
                            + "' para el producto.");
        }

        // Realizar la resta en la ubicación de origen
        int unidadesRestantes = prodOrigen.getUnidades() - productoRequest.getUnidades();
        if (unidadesRestantes == 0) {
            // Se elimina la entrada
            origen.getProductos().remove(prodOrigen);
        } else {
            prodOrigen.setUnidades(unidadesRestantes);
        }

        // Procesar la suma en la ubicación de destino
        // Asegurarse de que la colección de productos no sea nula
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
            prodDestino = destino.getProductos().stream()
                    .filter(p -> p.getRef() != null && p.getRef().equals(productoRequest.getRef()))
                    .findFirst().orElse(null);
        }

        if (prodDestino != null) {
            // Se suman las unidades a la entrada existente
            prodDestino.setUnidades(prodDestino.getUnidades() + productoRequest.getUnidades());
        } else {
            // No existe entrada en la ubicación destino: se crea una nueva
            ProductoUbicacion nuevoProducto = new ProductoUbicacion();
            nuevoProducto.setRef(productoRequest.getRef());
            nuevoProducto.setDescription(productoRequest.getDescription());
            nuevoProducto.setUnidades(productoRequest.getUnidades());
            // Para productos especiales, conservar el productoId (ya asignado en la
            // ubicación origen)

            destino.getProductos().add(nuevoProducto);
        }

        // Se guardan los cambios en ambas ubicaciones
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
        RestTemplate restTemplate = new RestTemplate();
        String url;

        if (productoUbicacion.getRef().equals("VISUAL")) {
            url = "http://localhost:8091/productos/visual/restarEspecial/" + productoUbicacion.getDescription();
        } else {
            url = "http://localhost:8091/productos/sinreferencia/restarEspecial/" + productoUbicacion.getDescription();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        HttpEntity<Integer> requestEntity = new HttpEntity<>(productoUbicacion.getUnidades(), headers);

        restTemplate.exchange(
                url,
                HttpMethod.PUT,
                requestEntity,
                String.class);
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
            System.out.println("Token recibido: " + (token != null ? "Presente" : "Ausente"));

            // Buscar la ubicación
            Ubicacion ubicacion = ubicacionesRepository.findByNombre(dto.getUbicacionNombre()).orElse(null);
            if (ubicacion == null) {
                return ResponseEntity.badRequest().body("Ubicación no encontrada: " + dto.getUbicacionNombre());
            }

            // Corregir: null sigue siendo null
            String estadoOrigenBuscar = dto.getEstadoOrigen() == null ? null : dto.getEstadoOrigen();
            String estadoDestinoBuscar = dto.getEstadoDestino() == null ? null : dto.getEstadoDestino();

            System.out.println("Buscando producto con estado origen: "
                    + (estadoOrigenBuscar == null ? "NULL" : estadoOrigenBuscar));

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
                                " y estado " + (dto.getEstadoOrigen() == null ? "SIN ESTADO" : dto.getEstadoOrigen())
                                + " en la ubicación");
            }

            System.out.println("Producto origen encontrado con " + productoOrigen.getUnidades() + " unidades");

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
                // Crear nuevo ProductoUbicacion con el estado destino
                productoDestino = new ProductoUbicacion();
                productoDestino.setRef(dto.getReferencia());
                productoDestino.setDescription(productoOrigen.getDescription());
                productoDestino.setEstado(estadoDestinoBuscar); // Puede ser null
                productoDestino.setUnidades(0);
                ubicacion.getProductos().add(productoDestino);
            } else {
                System.out.println("Producto destino ya existe con " + productoDestino.getUnidades() + " unidades");
            }

            // Actualizar cantidades
            productoOrigen.setUnidades(productoOrigen.getUnidades() - dto.getCantidad());
            productoDestino.setUnidades(productoDestino.getUnidades() + dto.getCantidad());

            System.out.println("Nuevas cantidades - Origen: " + productoOrigen.getUnidades() + ", Destino: "
                    + productoDestino.getUnidades());

            // Eliminar producto origen si queda sin stock
            if (productoOrigen.getUnidades() == 0) {
                System.out.println("Eliminando producto origen por stock 0");
                ubicacion.getProductos().remove(productoOrigen);
            }

            // Llamar al microservicio de productos para actualizar el stock
            TransferirEstadoDTO dtoProductos = new TransferirEstadoDTO();
            dtoProductos.setReferencia(dto.getReferencia());
            dtoProductos.setEstadoOrigen(dto.getEstadoOrigen()); // Mantener tal como viene (null o string)
            dtoProductos.setEstadoDestino(dto.getEstadoDestino());
            dtoProductos.setCantidad(dto.getCantidad());

            System.out.println("Llamando al microservicio de productos");
            transferirEstadoEnProductos(dtoProductos, token);

            // Guardar cambios en ubicación
            ubicacionesRepository.save(ubicacion);
            System.out.println("Ubicación guardada correctamente");

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

        // Crear el producto con estado si no existe
        String urlCrear = "http://localhost:8091/productos";
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        Producto producto = new Producto();
        producto.setReferencia(productoUbicacion.getRef());
        producto.setDescription(productoUbicacion.getDescription());
        producto.setEstado(productoUbicacion.getEstado());
        producto.setStock(productoUbicacion.getUnidades());

        HttpEntity<Producto> requestEntity = new HttpEntity<>(producto, headers);

        try {
            restTemplate.postForEntity(urlCrear, requestEntity, Producto.class);
        } catch (Exception e) {
            // Si ya existe, sumar stock
            String urlSumar = "http://localhost:8091/productos/" + productoUbicacion.getRef() + "/sumar";
            HttpEntity<Integer> sumarEntity = new HttpEntity<>(productoUbicacion.getUnidades(), headers);
            restTemplate.exchange(urlSumar, HttpMethod.PUT, sumarEntity, Producto.class);
        }
    }

    private void restarStockProductoNormalConEstado(ProductoUbicacion productoUbicacion, String token) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://localhost:8091/productos/" + productoUbicacion.getRef() + "/restar";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        HttpEntity<Integer> requestEntity = new HttpEntity<>(productoUbicacion.getUnidades(), headers);

        restTemplate.exchange(url, HttpMethod.PUT, requestEntity, Producto.class);
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
}