package com.manushd.app.salidas.controllers;

import com.manushd.app.salidas.models.Salida;
import com.manushd.app.salidas.models.Ubicacion;
import com.manushd.app.salidas.models.Producto;
import com.manushd.app.salidas.models.ProductoSalida;
import com.manushd.app.salidas.models.ProductoUbicacion;
import com.manushd.app.salidas.repository.SalidaRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

@Controller
@RestController
@RequestMapping("/salidas")
@PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
public class SalidaController {

    @Autowired
    private SalidaRepository salidasRepository;

    @GetMapping("")
    public Page<Salida> getSalidas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fechaEnvio") String sort) {

        return salidasRepository.findAll(
                PageRequest.of(page, size, Sort.by(sort)));
    }

    @GetMapping("/{id}")
    public Salida getSalidaById(@PathVariable Long id) {
        return salidasRepository.findById(id).orElse(null);
    }

    @GetMapping("/estado/{estado}")
    public Iterable<Salida> getSalidasByEstado(
            @PathVariable boolean estado) {

        return salidasRepository.findAllByEstadoOrderByFechaEnvioDesc(
                estado);
    }

    @GetMapping("/estado/{estado}/paginado")
    public Page<Salida> getSalidasByEstado(
            @PathVariable boolean estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return salidasRepository.findAllByEstadoOrderByFechaEnvioDesc(
                estado, PageRequest.of(page, size));
    }

    @GetMapping("/estado/{estado}/rellena/{rellena}/paginado")
    public Page<Salida> getSalidasByEstadoRellena(
            @PathVariable boolean estado,
            @PathVariable boolean rellena,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return salidasRepository.findAllByEstadoAndRellenaOrderByDireccionAsc(
                estado, rellena, PageRequest.of(page, size));
    }

    @GetMapping("/filtrar/paginado")
    public ResponseEntity<Page<Salida>> filtrarSalidasPaginado(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam String tipoBusqueda,
            @RequestParam(required = false) String textoBusqueda,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Salida> salidas = buscarSalidasFiltradasPaginado(
                fechaInicio, fechaFin, tipoBusqueda, textoBusqueda, pageable);

        return ResponseEntity.ok(salidas);
    }

    private Page<Salida> buscarSalidasFiltradasPaginado(
            LocalDate fechaInicio,
            LocalDate fechaFin,
            String tipoBusqueda,
            String textoBusqueda,
            Pageable pageable) {

        if (textoBusqueda == null || textoBusqueda.trim().isEmpty()) {
            return salidasRepository.findByFechaEnvioBetweenAndEstadoOrderByFechaEnvioDesc(
                    fechaInicio, fechaFin, true, pageable);
        }

        // Si hay texto, filtrar según el tipo de búsqueda
        switch (tipoBusqueda) {
            case "referencia":
                return salidasRepository.findByFechaAndReferenciaOrderByFechaEnvioDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            case "descripcion":
                return salidasRepository.findByFechaAndDescripcionOrderByFechaEnvioDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            case "observacion":
                return salidasRepository.findByFechaAndObservacionOrderByFechaEnvioDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            case "destino":
                return salidasRepository.findByFechaEnvioAndCamposOrderByFechaEnvioDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            default:
                return salidasRepository.findByFechaEnvioBetweenAndEstadoOrderByFechaEnvioDesc(
                        fechaInicio, fechaFin, true, pageable);
        }
    }

    @GetMapping("/filtrar")
    public ResponseEntity<Iterable<Salida>> filtrarSalidas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam String tipoBusqueda,
            @RequestParam(required = false) String textoBusqueda) {

        Iterable<Salida> salidas = buscarSalidasFiltradas(
                fechaInicio, fechaFin, tipoBusqueda, textoBusqueda);

        return ResponseEntity.ok(salidas);
    }

    private Iterable<Salida> buscarSalidasFiltradas(
            LocalDate fechaInicio,
            LocalDate fechaFin,
            String tipoBusqueda,
            String textoBusqueda) {

        if (textoBusqueda == null || textoBusqueda.trim().isEmpty()) {
            return salidasRepository.findByFechaEnvioBetweenAndEstadoOrderByFechaEnvioDesc(
                    fechaInicio, fechaFin, true);
        }

        // Si hay texto, filtrar según el tipo de búsqueda
        switch (tipoBusqueda) {
            case "referencia":
                return salidasRepository.findByFechaAndReferenciaOrderByFechaEnvioDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            case "descripcion":
                return salidasRepository.findByFechaAndDescripcionOrderByFechaEnvioDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            case "observacion":
                return salidasRepository.findByFechaAndObservacionOrderByFechaEnvioDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            case "destino":
                return salidasRepository.findByFechaEnvioAndCamposOrderByFechaEnvioDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            default:
                return salidasRepository.findByFechaEnvioBetweenAndEstadoOrderByFechaEnvioDesc(
                        fechaInicio, fechaFin, true);
        }
    }

    @GetMapping("/paletsEnviados")
    @PreAuthorize("hasRole('ADMIN')")
    public Integer getPaletsEnviados() {
        return salidasRepository.sumPaletsByEstadoTrue();
    }

    @PostMapping("/reubicarPalets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reubicarPalets(@RequestBody Salida salida) {
        // Si la salida está marcada como enviada (estado = true) se puede continuar,
        // sino se devuelve un error
        if (salida.getEstado() == null || !Boolean.TRUE.equals(salida.getEstado())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La salida debe estar marcada como enviada.");
        }

        // Si la salida no tiene fecha de envío se devuelve un error
        if (salida.getFechaEnvio() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La salida debe tener una fecha de envío.");
        }

        // Si la salida no tiene productos se devuelve un error
        if (salida.getProductos() == null || salida.getProductos().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La salida debe tener al menos un producto.");
        }

        // Si el destino de la salida es distinta de "REUBICACION DE PALETS" se devuelve
        // un error
        if (salida.getDestino() == null || !"REUBICACION DE PALETS".equalsIgnoreCase(salida.getDestino())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Destino incorrecto.");
        }

        // Si el número de palets es menor que 1 se devuelve un error
        for (ProductoSalida producto : salida.getProductos()) {
            if (producto.getPalets() == null || producto.getPalets() < 1) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("El número de palets debe ser mayor o igual a 1.");
            }
        }

        Salida s = salidasRepository.save(salida);
        return ResponseEntity.ok(s);
    }

    private boolean todosLosCamposRellenos(Salida salida) {
        if (salida.getProductos() == null || salida.getProductos().isEmpty()) return false;

        return salida.getProductos().stream().allMatch(producto ->
            producto.getDescription() != null &&
            producto.getUnidades() != null &&
            producto.getUnidades() > 0 &&
            producto.getUbicacion() != null &&
            !producto.getUbicacion().isEmpty() &&
            producto.getPalets() != null &&
            producto.getPalets() >= 0 &&
            producto.getBultos() != null &&
            producto.getBultos() >= 0 &&
            producto.getFormaEnvio() != null &&
            !producto.getFormaEnvio().trim().isEmpty() &&
            Boolean.TRUE.equals(producto.getComprobado())
        );
    }

    /**
     * Método para agregar una salida.
     * Se valida cada producto;
     * Para productos especiales ("VISUAL" o "SIN REFERENCIA") se omite la
     * verificación en el microservicio de Productos.
     */
    @PostMapping("")
    public ResponseEntity<?> addSalida(@RequestBody Salida salida,
            @RequestHeader("Authorization") String token) {
        List<Ubicacion> ubicacionesList = new ArrayList<>();
        RestTemplate restTemplate = new RestTemplate();

        // Crear los headers con el token para reutilizarlos en las llamadas
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        if (Boolean.TRUE.equals(salida.getEstado())) {
            // Lista para almacenar las ubicaciones (únicas) de la salida
            List<String> nombresUbicaciones = new ArrayList<>();

            // Validar cada producto de la salida
            for (ProductoSalida productoSalida : salida.getProductos()) {
                try {
                    // Validaciones generales
                    if (salida.getFechaEnvio() == null) {
                        throw new IllegalArgumentException("La fecha de envío no puede estar en blanco.");
                    }
                    if (productoSalida.getUnidades() <= 0) {
                        throw new IllegalArgumentException("Las unidades deben ser mayores a 0.");
                    }
                    if (productoSalida.getRef() == null || productoSalida.getRef().isBlank()) {
                        throw new IllegalArgumentException("La referencia del producto no puede estar en blanco.");
                    }
                    if (productoSalida.getComprobado() == null || !productoSalida.getComprobado()) {
                        throw new IllegalArgumentException("Faltan productos por comprobar.");
                    }

                    String ref = productoSalida.getRef();

                    // Para productos normales se valida existencia y stock en el microservicio de
                    // Productos
                    if (!isProductoEspecial(ref)) {
                        // Se utiliza el token en los headers de la petición
                        HttpEntity<?> entity = new HttpEntity<>(headers);
                        ResponseEntity<Producto> response = restTemplate.exchange(
                                "http://localhost:8091/productos/referencia/" + ref,
                                HttpMethod.GET,
                                entity,
                                Producto.class);
                        Producto producto = response.getBody();
                        if (producto == null) {
                            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                    .body("El producto con referencia " + ref + " no existe.");
                        } else if (producto.getStock() < productoSalida.getUnidades()) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("No hay suficiente stock del producto con referencia "
                                            + ref + " en la ubicación " + productoSalida.getUbicacion());
                        }
                    }

                    // Para productos especiales se omite la validación en el servicio de Productos
                    // Construir u obtener la Ubicación correspondiente
                    String ubicacionNombre = productoSalida.getUbicacion();
                    Ubicacion ubicacion = null;
                    if (!nombresUbicaciones.contains(ubicacionNombre)) {
                        nombresUbicaciones.add(ubicacionNombre);
                        ubicacion = new Ubicacion();
                        // Se utiliza ArrayList para evitar deduplicación automática de productos
                        // especiales
                        ubicacion.setProductos(new ArrayList<>());
                        ubicacion.setNombre(ubicacionNombre);
                        ubicacionesList.add(ubicacion);
                    } else {
                        // Buscar la ubicación ya creada en la lista
                        for (Ubicacion u : ubicacionesList) {
                            if (u.getNombre().equals(ubicacionNombre)) {
                                ubicacion = u;
                                break;
                            }
                        }
                    }
                    // Crear un ProductoUbicacion a partir del ProductoSalida
                    ProductoUbicacion productoUbicacion = new ProductoUbicacion();
                    productoUbicacion.setRef(ref);
                    productoUbicacion.setUnidades(productoSalida.getUnidades());
                    productoUbicacion.setDescription(productoSalida.getDescription());

                    // Agregar el producto a la ubicación
                    ubicacion.getProductos().add(productoUbicacion);

                } catch (HttpClientErrorException.NotFound e) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("El producto con referencia " + productoSalida.getRef() + " no existe.");
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(e.getMessage());
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("Error al procesar la salida: " + e.getMessage());
                }
            }

            // Obtener todas las ubicaciones actuales desde el microservicio de Ubicaciones
            HttpEntity<?> ubicacionesEntity = new HttpEntity<>(headers);
            ResponseEntity<Ubicacion[]> responseUbicaciones = restTemplate.exchange(
                    "http://localhost:8095/ubicaciones",
                    HttpMethod.GET,
                    ubicacionesEntity,
                    Ubicacion[].class);
            Ubicacion[] ubicacionesArray = responseUbicaciones.getBody();

            if (ubicacionesArray == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error al obtener las ubicaciones.");
            } else {
                // Para cada ubicación de la salida se comprueba el stock existente en el
                // almacén
                for (Ubicacion ubicacionSalida : ubicacionesList) {
                    boolean ubicacionEncontrada = false;
                    for (Ubicacion ubicacionActual : ubicacionesArray) {
                        if (ubicacionActual.getNombre().equals(ubicacionSalida.getNombre())) {
                            ubicacionEncontrada = true;
                            // Para cada producto solicitado en la salida
                            for (ProductoUbicacion productoSalidaUb : ubicacionSalida.getProductos()) {
                                boolean stockSuficiente = false;
                                // Si el producto es especial se delega la comprobación en el microservicio
                                if (isProductoEspecial(productoSalidaUb.getRef())) {
                                    // Buscar en la ubicación actual un producto especial con la misma referencia
                                    for (ProductoUbicacion pu : ubicacionActual.getProductos()) {
                                        if (isProductoEspecial(pu.getRef()) &&
                                                pu.getRef().equalsIgnoreCase(productoSalidaUb.getRef()) &&
                                                pu.getUnidades() >= productoSalidaUb.getUnidades()) {
                                            stockSuficiente = true;
                                            break;
                                        }
                                    }
                                } else {
                                    // Buscar en la ubicación actual un producto con la misma referencia
                                    for (ProductoUbicacion pu : ubicacionActual.getProductos()) {
                                        if (pu.getRef().equals(productoSalidaUb.getRef()) &&
                                                pu.getUnidades() >= productoSalidaUb.getUnidades()) {
                                            stockSuficiente = true;
                                            break;
                                        }
                                    }
                                }
                                if (!stockSuficiente) {
                                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                            .body("No hay suficiente stock del producto con referencia "
                                                    + productoSalidaUb.getRef() + " en la ubicación "
                                                    + ubicacionSalida.getNombre());
                                }
                            }
                            break;
                        }
                    }
                    if (!ubicacionEncontrada) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("La ubicación " + ubicacionSalida.getNombre() + " no se encontró en el almacén.");
                    }
                }
            }

            // Actualizar el stock de cada ubicación llamando al endpoint
            // /ubicaciones/restar
            for (Ubicacion ubicacion : ubicacionesList) {
                try {
                    HttpEntity<Ubicacion> requestEntity = new HttpEntity<>(ubicacion, headers);
                    ResponseEntity<Ubicacion> response = restTemplate.exchange(
                            "http://localhost:8095/ubicaciones/restar",
                            HttpMethod.POST,
                            requestEntity,
                            Ubicacion.class);
                    // Se puede procesar la respuesta si es necesario
                } catch (HttpClientErrorException e) {
                    String errorMessage = e.getResponseBodyAsString();
                    return ResponseEntity.status(e.getStatusCode())
                            .body(errorMessage);
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("Error inesperado: " + e.getMessage());
                }
            }
        }

        // Guardar la salida (ya con estado true) y retornar la respuesta
        Salida savedSalida = salidasRepository.save(salida);
        return ResponseEntity.ok(savedSalida);
    }

    @PutMapping("/{id}")
    public Salida updateSalida(@PathVariable Long id, @RequestBody Salida salida) {
        Salida salidaAux = salidasRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Salida no encontrada"));
        if (salidaAux != null) {
            return salidasRepository.save(salida);
        }
        return null;
    }

    @PutMapping("/{id}/enviar")
    public ResponseEntity<?> setEnviada(@PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        Salida salidaAux = salidasRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Salida no encontrada"));
        if (salidaAux != null) {
            salidaAux.setEstado(true);
            return addSalida(salidaAux, token);
        }
        return null;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteById(@PathVariable Long id) {
        salidasRepository.deleteById(id);
    }

    // Método auxiliar para identificar productos especiales
    private boolean isProductoEspecial(String ref) {
        return "VISUAL".equalsIgnoreCase(ref) || "SIN REFERENCIA".equalsIgnoreCase(ref);
    }
}
