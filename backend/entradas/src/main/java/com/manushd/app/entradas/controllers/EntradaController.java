package com.manushd.app.entradas.controllers;

import com.manushd.app.entradas.models.Entrada;
import com.manushd.app.entradas.models.Producto;
import com.manushd.app.entradas.models.ProductoEntrada;
import com.manushd.app.entradas.models.Ubicacion;
import com.manushd.app.entradas.models.ProductoUbicacion;
import com.manushd.app.entradas.repository.EntradaRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
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
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

@Controller
@RestController
@RequestMapping("/entradas")
@PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
public class EntradaController {

    @Autowired
    private EntradaRepository entradasRepository;

    @GetMapping("")
    public Page<Entrada> getEntradas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fechaRecepcion") String sort) {
        return entradasRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sort)));
    }

    @GetMapping("/{id}")
    public Entrada getEntradaById(@PathVariable Long id) {
        return entradasRepository.findById(id).orElse(null);
    }

    @GetMapping("/estado/{estado}")
    public Iterable<Entrada> getEntradasByEstado(@PathVariable boolean estado) {
        return entradasRepository.findAllByEstadoOrderByFechaRecepcionDesc(estado);
    }

    @GetMapping("/estado/{estado}/paginado")
    public Page<Entrada> getEntradasOrdenadasByEstado(
            @PathVariable boolean estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return entradasRepository.findAllByEstadoOrderByFechaRecepcionDesc(
                estado, PageRequest.of(page, size));
    }

    @GetMapping("/filtrar/paginado")
    public ResponseEntity<Page<Entrada>> filtrarEntradasPaginado(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam String tipoBusqueda,
            @RequestParam(required = false) String textoBusqueda,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Entrada> entradas = buscarEntradasFiltradasPaginado(
                fechaInicio, fechaFin, tipoBusqueda, textoBusqueda,
                PageRequest.of(page, size));

        return ResponseEntity.ok(entradas);
    }

    private Page<Entrada> buscarEntradasFiltradasPaginado(
            LocalDate fechaInicio,
            LocalDate fechaFin,
            String tipoBusqueda,
            String textoBusqueda,
            Pageable pageable) {

        // Si no hay texto de búsqueda, solo filtrar por fechas
        if (textoBusqueda == null || textoBusqueda.trim().isEmpty()) {
            return entradasRepository.findByFechaRecepcionBetweenAndEstadoOrderByFechaRecepcionDesc(
                    fechaInicio, fechaFin, true, pageable);
        }

        // Si hay texto, filtrar según el tipo de búsqueda
        switch (tipoBusqueda) {
            case "referencia":
                return entradasRepository.findByFechaAndReferenciaOrderByFechaRecepcionDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            case "descripcion":
                return entradasRepository.findByFechaAndDescripcionOrderByFechaRecepcionDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            case "observacion":
                return entradasRepository.findByFechaAndObservacionOrderByFechaRecepcionDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            case "origen":
                return entradasRepository.findByFechaAndOrigenOrderByFechaRecepcionDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            default:
                return entradasRepository.findByFechaRecepcionBetweenAndEstadoOrderByFechaRecepcionDesc(
                        fechaInicio, fechaFin, true, pageable);
        }
    }

    @GetMapping("/filtrar")
    public ResponseEntity<Iterable<Entrada>> filtrarEntradas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam String tipoBusqueda,
            @RequestParam(required = false) String textoBusqueda) {

        Iterable<Entrada> entradas = buscarEntradasFiltradas(
                fechaInicio, fechaFin, tipoBusqueda, textoBusqueda);

        return ResponseEntity.ok(entradas);
    }

    private Iterable<Entrada> buscarEntradasFiltradas(
            LocalDate fechaInicio,
            LocalDate fechaFin,
            String tipoBusqueda,
            String textoBusqueda) {

        // Si no hay texto de búsqueda, solo filtrar por fechas
        if (textoBusqueda == null || textoBusqueda.trim().isEmpty()) {
            return entradasRepository.findByFechaRecepcionBetweenAndEstadoOrderByFechaRecepcionDesc(
                    fechaInicio, fechaFin, true);
        }

        // Si hay texto, filtrar según el tipo de búsqueda
        switch (tipoBusqueda) {
            case "referencia":
                return entradasRepository.findByFechaAndReferenciaOrderByFechaRecepcionDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            case "descripcion":
                return entradasRepository.findByFechaAndDescripcionOrderByFechaRecepcionDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            case "observacion":
                return entradasRepository.findByFechaAndObservacionOrderByFechaRecepcionDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            case "origen":
                return entradasRepository.findByFechaAndOrigenOrderByFechaRecepcionDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            default:
                return entradasRepository.findByFechaRecepcionBetweenAndEstadoOrderByFechaRecepcionDesc(
                        fechaInicio, fechaFin, true);
        }
    }

    @GetMapping("/paletsRecibidos")
    @PreAuthorize("hasRole('ADMIN')")
    public Integer getPaletsRecibidos() {
        return entradasRepository.sumPaletsByEstadoTrue();
    }

    @PostMapping("/reubicarPalets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reubicarPalets(@RequestBody Entrada entrada) {

        // Si la entrada está marcada como recibida (estado == true) se puede continuar,
        // sino se devuelve un error
        if (entrada.getEstado() == null || !Boolean.TRUE.equals(entrada.getEstado())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La entrada no ha sido recibida");
        }

        // Si la entrada no tiene fecha de recepción, se devuelve un error
        if (entrada.getFechaRecepcion() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La entrada no tiene fecha de recepción");
        }

        // Si la entrada no tiene productos, se devuelve un error
        if (entrada.getProductos() == null || entrada.getProductos().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("No se han recibido productos en la entrada");
        }

        // Si el origen de la entrada es distinta de "REUBICACION DE PALETS", se
        // devuelve un error
        if (entrada.getEstado() == null || !"REUBICACION DE PALETS".equals(entrada.getOrigen())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Origen incorrecto");
        }

        // Si el número de palets es menos que 1, se devuelve un error
        for (ProductoEntrada productoEntrada : entrada.getProductos()) {
            if (productoEntrada.getPalets() == null || productoEntrada.getPalets() < 1) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("El número de palets debe ser mayor o igual a 1");
            }
        }

        Entrada e = entradasRepository.save(entrada);
        return ResponseEntity.ok(e);
    }

    @PostMapping("")
    public ResponseEntity<?> addEntrada(@RequestBody Entrada entrada, @RequestHeader("Authorization") String token) {
        if (Boolean.TRUE.equals(entrada.getEstado())) {
            if (entrada.getProductos().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("No se han recibido productos en la entrada");
            }

            if (entrada.getFechaRecepcion() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("La entrada no tiene fecha de recepción");
            }

            Set<ProductoEntrada> comprobadosTrue = new HashSet<>();
            Set<ProductoEntrada> comprobadosFalse = new HashSet<>();

            for (ProductoEntrada producto : entrada.getProductos()) {
                if (producto.getUnidades() <= 0) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Los productos deben tener al menos 1 unidad");
                }

                if (producto.getEstado() == null || producto.getEstado().isEmpty()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Los productos deben tener un estado asignado");
                }

                if (Boolean.FALSE.equals(producto.getComprobado())) {
                    comprobadosFalse.add(producto);
                } else {
                    if (producto.getUnidades() <= 0) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Los productos checkeados deben tener al menos 1 unidad");
                    }
                    if (producto.getDescription() == null || producto.getDescription().isEmpty()
                            || "".equals(producto.getDescription())) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Los productos checkeados deben tener una descripción asignada");
                    }
                    if (producto.getUbicacion() == null || producto.getUbicacion().isEmpty()
                            || "".equals(producto.getUbicacion())) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Los productos checkeados deben tener una ubicación asignada");
                    }
                    comprobadosTrue.add(producto);
                }
            }

            List<Entrada> entradasParaGuardar = new ArrayList<>();
            Entrada saved = null;

            // Crear entrada con comprobados = true, solo si hay productos comprobados
            if (!comprobadosTrue.isEmpty()) {
                Entrada entradaComprobadosTrue = copiarEntradaSinProductos(entrada);
                entradaComprobadosTrue.setEstado(true);
                entradaComprobadosTrue.setProductos(comprobadosTrue);

                verificarYCrearProductos(comprobadosTrue, token);
                crearUbicacion(entradaComprobadosTrue, token);

                saved = entradasRepository.save(entradaComprobadosTrue);
                entradasParaGuardar.add(saved); // Guardar la entrada con comprobados=true
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Todos los productos están sin checkear");
            }

            // Crear entrada con comprobados = false, solo si hay productos no comprobados
            if (!comprobadosFalse.isEmpty()) {
                Entrada entradaComprobadosFalse = copiarEntradaSinProductos(entrada);
                entradaComprobadosFalse.setEstado(false);
                entradaComprobadosFalse.setProductos(comprobadosFalse);

                saved = entradasRepository.save(entradaComprobadosFalse);
                entradasParaGuardar.add(saved); // Guardar la entrada con comprobados=false
            }

            if (entrada.getId() != null) {
                Optional<Entrada> entradaAntigua = entradasRepository.findById(entrada.getId());
                if (entradaAntigua.isPresent()) {
                    deleteById(entrada.getId());
                }
            }

            // Si no se guardaron entradas con estado=true, entonces evitar la creación de
            // entradas vacías
            if (entradasParaGuardar.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("No se pueden crear entradas sin productos");
            }

            return ResponseEntity.ok(entradasParaGuardar);
        } else {
            // Si estado != true, comportamiento original
            Entrada savedEntrada = entradasRepository.save(entrada);
            return ResponseEntity.ok(savedEntrada);
        }
    }

    // Copia todos los datos de una entrada, excepto productos e id
    private Entrada copiarEntradaSinProductos(Entrada original) {
        Entrada copia = new Entrada();
        copia.setOrigen(original.getOrigen());
        copia.setFechaRecepcion(original.getFechaRecepcion());
        copia.setPerfumeria(original.getPerfumeria());
        copia.setPdv(original.getPdv());
        copia.setColaborador(original.getColaborador());
        copia.setDcs(original.getDcs());
        return copia;
    }

    private void verificarYCrearProductos(Set<ProductoEntrada> productos, String token) {
        RestTemplate restTemplate = new RestTemplate();
        String productosServiceUrl = "http://localhost:8091/productos";

        for (ProductoEntrada productoEntrada : productos) {
            String ref = productoEntrada.getRef();
            String estado = productoEntrada.getEstado();

            if (!"SIN REFERENCIA".equals(ref) && !"VISUAL".equals(ref)) {
                HttpHeaders headers = new HttpHeaders();
                headers.set("Authorization", token);
                HttpEntity<String> entity = new HttpEntity<>(headers);

                System.out.println("Verificando producto: " + ref + " con estado: " + estado);

                // Verificar si ya existe el producto con esa referencia y estado específicos
                try {
                    ResponseEntity<Producto> response = restTemplate.exchange(
                            productosServiceUrl + "/referencia/" + ref + "/estado/" + estado,
                            HttpMethod.GET,
                            entity,
                            Producto.class);

                    if (response.getBody() != null) {
                        System.out.println("Producto ya existe: " + ref + " - " + estado);
                        continue; // El producto ya existe, no hacer nada
                    }
                } catch (Exception e) {
                    System.out.println("Producto no encontrado, procediendo a crear: " + ref + " - " + estado);
                }

                // Si llegamos aquí, el producto no existe y debemos crearlo
                try {
                    Producto nuevoProducto = new Producto();
                    nuevoProducto.setReferencia(ref);
                    nuevoProducto.setDescription(productoEntrada.getDescription());
                    nuevoProducto.setStock(0);
                    nuevoProducto.setEstado(estado);

                    HttpEntity<Producto> request = new HttpEntity<>(nuevoProducto, headers);

                    System.out.println("Creando nuevo producto: " + nuevoProducto);

                    ResponseEntity<Producto> postResponse = restTemplate.exchange(
                            productosServiceUrl,
                            HttpMethod.POST,
                            request,
                            Producto.class);

                    if (postResponse.getStatusCode().is2xxSuccessful()) {
                        System.out.println("Producto creado exitosamente: " + ref + " - " + estado);
                    } else {
                        System.err.println("Error al crear producto: " + postResponse.getStatusCode());
                    }
                } catch (HttpClientErrorException e) {
                    if (e.getStatusCode().value() == 400
                            && e.getResponseBodyAsString().contains("Ya existe un producto")) {
                        System.out.println("Producto ya existe (capturado en catch): " + ref + " - " + estado);
                        // No es un error fatal, continuar con el siguiente producto
                    } else {
                        System.err.println("Error al crear producto: " + e.getMessage());
                        throw new RuntimeException("Error al crear producto: " + ref + " - " + estado, e);
                    }
                } catch (Exception ex) {
                    System.err.println("Excepción general al crear producto: " + ex.getMessage());
                    // Continuar con el siguiente producto en lugar de fallar completamente
                }
            } else {
                System.out.println("Producto especial detectado: " + ref + " - saltando verificación");
            }
        }
    }

    /**
     * Crea ubicaciones a partir de los productos de la entrada.
     * Para cada ubicación (según el nombre definido en el ProductoEntrada), se crea
     * un objeto Ubicacion
     * con su correspondiente ProductoUbicacion, y se envía al microservicio de
     * Ubicaciones (POST /ubicaciones/sumar).
     */
    private void crearUbicacion(Entrada entrada, String token) {
        List<Ubicacion> listaUbicaciones = new ArrayList<>();
        RestTemplate restTemplate = new RestTemplate();

        System.out.println("=== CREANDO UBICACIONES ===");
        System.out.println("Token recibido: " + (token != null && !token.isEmpty() ? "Presente" : "Ausente"));

        // IMPORTANTE: Configurar headers con token para autenticación
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        headers.set("Authorization", token); // Pasar el token JWT

        Map<String, Ubicacion> ubicacionMap = new HashMap<>();

        for (ProductoEntrada productoEntrada : entrada.getProductos()) {
            String ubicacionNombre = productoEntrada.getUbicacion();

            Ubicacion ubicacion = ubicacionMap.computeIfAbsent(ubicacionNombre, k -> {
                Ubicacion nuevaUbicacion = new Ubicacion();
                nuevaUbicacion.setNombre(ubicacionNombre);
                nuevaUbicacion.setProductos(new HashSet<>());
                listaUbicaciones.add(nuevaUbicacion);
                return nuevaUbicacion;
            });

            ProductoUbicacion productoUbicacion = new ProductoUbicacion();
            productoUbicacion.setRef(productoEntrada.getRef());
            productoUbicacion.setUnidades(productoEntrada.getUnidades());
            productoUbicacion.setDescription(productoEntrada.getDescription());
            productoUbicacion.setEstado(productoEntrada.getEstado());

            System.out.println("Producto agregado: " + productoUbicacion);
            ubicacion.getProductos().add(productoUbicacion);
        }

        System.out.println("Ubicaciones a enviar: " + listaUbicaciones.size());

        String url = "http://localhost:8095/ubicaciones/sumar";

        for (Ubicacion ubicacion : listaUbicaciones) {
            try {
                HttpEntity<Ubicacion> requestEntity = new HttpEntity<>(ubicacion, headers);

                System.out.println("Enviando ubicación con autenticación: " + ubicacion.getNombre());
                System.out.println("Headers: Authorization = " + (token != null ? "Presente" : "Ausente"));

                ResponseEntity<Ubicacion> response = restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        requestEntity,
                        Ubicacion.class);

                if (response.getStatusCode().is2xxSuccessful()) {
                    System.out.println("Ubicación enviada exitosamente: " + ubicacion.getNombre());
                } else {
                    System.err.println("Error al enviar ubicación: " + response.getStatusCode());
                    throw new RuntimeException("Error al enviar la ubicación: " + ubicacion.getNombre());
                }
            } catch (Exception e) {
                System.err.println("Excepción al enviar ubicación " + ubicacion.getNombre() + ": " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException(
                        "Error al enviar la ubicación: " + ubicacion.getNombre() + " - " + e.getMessage());
            }
        }
    }

    // Nuevo método para actualizar stock directamente desde EntradaController
    private void actualizarStockProducto(ProductoEntrada productoEntrada, String token) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        headers.set("Content-Type", "application/json");

        String ref = productoEntrada.getRef();
        String estado = productoEntrada.getEstado();

        System.out.println("Actualizando stock para: " + ref + " | Estado: " + estado + " | Unidades: "
                + productoEntrada.getUnidades());

        try {
            // Verificar si el producto existe
            String urlVerificar = "http://localhost:8091/productos/referencia/" + ref + "/estado/" + estado;
            HttpEntity<Void> verificarEntity = new HttpEntity<>(headers);

            ResponseEntity<Producto> verificarResponse = restTemplate.exchange(
                    urlVerificar,
                    HttpMethod.GET,
                    verificarEntity,
                    Producto.class);

            if (verificarResponse.getBody() != null) {
                // El producto existe, sumar stock usando método específico por estado
                System.out.println("Producto existe, sumando " + productoEntrada.getUnidades() + " unidades");
                // Por ahora, no sumar stock automáticamente para evitar errores
                // Se manejará manualmente o con una solución posterior
            }
        } catch (Exception e) {
            System.out.println("Producto no encontrado o error al verificar: " + e.getMessage());
            // El stock se actualizará manualmente o con otra estrategia
        }
    }

    @PutMapping("/{id}")
    public Entrada updateEntrada(@PathVariable Long id, @RequestBody Entrada entrada) {
        Entrada entradaAux = entradasRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));
        if (entradaAux != null) {
            System.out.println("Entrada recibida ID: " + entrada.getId());
            return entradasRepository.save(entrada);
        }
        return null;
    }

    @PutMapping("/{id}/recibir")
    public ResponseEntity<?> setRecibida(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        Entrada entradaAux = entradasRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));
        if (entradaAux != null) {
            // Marcar la entrada como recibida y procesarla
            entradaAux.setEstado(true);
            return addEntrada(entradaAux, token);
        }
        return null;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteById(@PathVariable Long id) {
        entradasRepository.deleteById(id);
    }
}
