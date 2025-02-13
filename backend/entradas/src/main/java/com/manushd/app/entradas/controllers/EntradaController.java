package com.manushd.app.entradas.controllers;

import com.manushd.app.entradas.models.Entrada;
import com.manushd.app.entradas.models.Producto;
import com.manushd.app.entradas.models.ProductoDcs;
import com.manushd.app.entradas.models.ProductoEntrada;
import com.manushd.app.entradas.models.Ubicacion;
import com.manushd.app.entradas.models.ProductoUbicacion;
import com.manushd.app.entradas.models.DCS;
import com.manushd.app.entradas.repository.EntradaRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.IntStream;
import java.util.Date;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@Controller
@RestController
@CrossOrigin(value = "http://localhost:4200")
public class EntradaController {

    @Autowired
    private EntradaRepository entradasRepository;

    @GetMapping("/entradas")
    public Iterable<Entrada> getEntradas() {
        return entradasRepository.findAll();
    }

    @GetMapping("/entradas/{id}")
    public Entrada getEntradaById(@PathVariable Long id) {
        return entradasRepository.findById(id).orElse(null);
    }

    @GetMapping("/entradas/estado/{estado}")
    public Iterable<Entrada> getEntradasByEstado(@PathVariable boolean estado) {
        return entradasRepository.findAllByEstado(estado);
    }

    @GetMapping("/entradas/estado/{estado}/orderByRecepcion")
    public Iterable<Entrada> getEntradasOrdenadas(@PathVariable boolean estado) {
        return entradasRepository.findAllByEstadoOrderByFechaRecepcionAsc(estado);
    }

    @PostMapping("/entradas")
    public ResponseEntity<?> addEntrada(@RequestBody Entrada entrada) {
        boolean reintegrar = false;
        Long idReintegrar = -1L;

        // Si la entrada está marcada como recibida (estado=true)
        if (Boolean.TRUE.equals(entrada.getEstado())) {
            RestTemplate restTemplate = new RestTemplate();

            // Separar productos pendientes y recibidos
            Set<ProductoEntrada> productosPendientes = new HashSet<>();
            Set<ProductoEntrada> productosRecibidos = new HashSet<>();

            for (ProductoEntrada producto : entrada.getProductos()) {
                // Validar que la cantidad sea mayor a 0 (para cualquier producto)
                if (producto.getUnidades() <= 0) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Los productos deben tener al menos 1 unidad");
                }

                if (Boolean.TRUE.equals(producto.getPendiente())) {
                    // Si ya se tiene un idPadre se respeta; de lo contrario se asigna el id de la
                    // entrada
                    if (producto.getIdPadre() == null) {
                        producto.setIdPadre(entrada.getId());
                    }
                    productosPendientes.add(producto);
                } else {
                    // Si existe un idPadre en un producto recibido, se activa el flag de reintegro
                    if (producto.getIdPadre() != null && !reintegrar) {
                        reintegrar = true;
                        idReintegrar = producto.getIdPadre();
                    }
                    productosRecibidos.add(producto);
                }
            }

            // Si no hay productos recibidos, no se procesa la entrada
            if (productosRecibidos.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("No se han recibido productos en la entrada");
            }

            // Crear y guardar una nueva entrada para los productos pendientes
            // (estado=false)
            if (!productosPendientes.isEmpty()) {
                Entrada entradaPendiente = new Entrada();
                entradaPendiente.setOrigen(entrada.getOrigen());
                entradaPendiente.setEstado(false); // Entrada pendiente
                entradaPendiente.setProductos(productosPendientes);
                entradasRepository.save(entradaPendiente);
            }

            // Actualizar la entrada original con los productos recibidos
            entrada.setProductos(productosRecibidos);

            /*-------------------------------------------------------------------------
             En este punto se tratarán solo los productos que hayan llegado al almacén
             -------------------------------------------------------------------------*/

            // Para cada producto recibido, si es producto "normal" se verifica su
            // existencia en Productos.
            // En caso de productos especiales ("VISUAL" o "SIN REFERENCIA"), se omite la
            // comprobación.
            for (ProductoEntrada productoEntrada : entrada.getProductos()) {
                String ref = productoEntrada.getRef();
                if ("SIN REFERENCIA".equals(ref) || "VISUAL".equals(ref)) {
                    // No se realiza comprobación ni creación en el microservicio de Productos
                    continue;
                } else {
                    try {
                        // Intentar obtener el producto por referencia
                        ResponseEntity<Producto> response = restTemplate.getForEntity(
                                "http://localhost:8091/productos/referencia/" + ref,
                                Producto.class);

                        // Si la cantidad es menor o igual a 0 se lanza excepción (aunque ya se validó
                        // anteriormente)
                        if (productoEntrada.getUnidades() <= 0) {
                            throw new IllegalArgumentException("Los productos no pueden tener menos de 1 unidad");
                        } else if (response.getBody() == null) {
                            // Si el producto no existe, se crea uno con stock inicial 0
                            Producto nuevoProducto = new Producto();
                            nuevoProducto.setReferencia(ref);
                            nuevoProducto.setDescription(productoEntrada.getDescription());
                            nuevoProducto.setStock(0);

                            // Llamada al endpoint para crear el producto normal
                            restTemplate.postForEntity(
                                    "http://localhost:8091/productos",
                                    nuevoProducto,
                                    Producto.class);
                        }
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(e.getMessage());
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body("Error al procesar la entrada: " + e.getMessage());
                    }
                }
            }
        }

        Entrada savedEntrada = null;

        // Si se está reintegrando (por haber productos con idPadre)
        if (reintegrar) {
            Entrada entradaAntigua = entradasRepository.findById(idReintegrar).orElse(null);
            if (entradaAntigua != null) {
                // Crear un nuevo conjunto para evitar problemas de concurrencia
                Set<ProductoEntrada> productosActualizados = new HashSet<>(entradaAntigua.getProductos());
                // Añadir los nuevos productos (forzando nueva inserción y asignando el idPadre)
                for (ProductoEntrada producto : entrada.getProductos()) {
                    ProductoEntrada nuevoProducto = new ProductoEntrada();
                    BeanUtils.copyProperties(producto, nuevoProducto);
                    nuevoProducto.setId(null); // Forzar inserción como nuevo registro
                    nuevoProducto.setIdPadre(entradaAntigua.getId());
                    productosActualizados.add(nuevoProducto);
                }
                entradaAntigua.setProductos(productosActualizados);
                savedEntrada = entradasRepository.save(entradaAntigua);
            }
        } else {
            savedEntrada = entradasRepository.save(entrada);
        }

        // Crear la entrada en Ubicaciones y actualizar stock
        if (Boolean.TRUE.equals(entrada.getEstado())) {
            if (reintegrar) {
                crearUbicacion(entrada);
                entradasRepository.deleteById(entrada.getId());
            } else {
                crearUbicacion(savedEntrada);
            }
        }

        return ResponseEntity.ok(savedEntrada);
    }

    /**
     * Crea ubicaciones a partir de los productos de la entrada.
     * Para cada ubicación (según el nombre definido en el ProductoEntrada), se crea
     * un objeto Ubicacion
     * con su correspondiente ProductoUbicacion, y se envía al microservicio de
     * Ubicaciones (POST /ubicaciones/sumar).
     */
    private void crearUbicacion(Entrada entrada) {
        List<Ubicacion> listaUbicaciones = new ArrayList<>();
        RestTemplate restTemplate = new RestTemplate();

        Map<String, Ubicacion> ubicacionMap = new HashMap<>();

        for (ProductoEntrada productoEntrada : entrada.getProductos()) {
            String ubicacionNombre = productoEntrada.getUbicacion();
            // Si no existe la ubicación en el mapa, se crea y se añade a la lista
            Ubicacion ubicacion = ubicacionMap.computeIfAbsent(ubicacionNombre, k -> {
                Ubicacion nuevaUbicacion = new Ubicacion();
                nuevaUbicacion.setNombre(ubicacionNombre);
                nuevaUbicacion.setProductos(new HashSet<>());
                listaUbicaciones.add(nuevaUbicacion);
                return nuevaUbicacion;
            });

            // Crear un ProductoUbicacion a partir del ProductoEntrada
            ProductoUbicacion productoUbicacion = new ProductoUbicacion();
            productoUbicacion.setRef(productoEntrada.getRef());
            productoUbicacion.setUnidades(productoEntrada.getUnidades());
            productoUbicacion.setDescription(productoEntrada.getDescription());
            // Para productos especiales, el microservicio de Ubicaciones se encargará de
            // asignar el productoId

            ubicacion.getProductos().add(productoUbicacion);
        }

        String url = "http://localhost:8095/ubicaciones/sumar";

        // Enviar cada ubicación con sus productos al microservicio de Ubicaciones
        listaUbicaciones.forEach(ubicacion -> {
            try {
                restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        new HttpEntity<>(ubicacion),
                        Ubicacion.class);
            } catch (Exception e) {
                System.out.println("Excepción al enviar la ubicación: " + ubicacion.getNombre());
                e.printStackTrace();
            }
        });
    }

    @PutMapping("/entradas/{id}")
    public Entrada updateEntrada(@PathVariable Long id, @RequestBody Entrada entrada) {
        Entrada entradaAux = entradasRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));
        if (entradaAux != null) {
            return entradasRepository.save(entrada);
        }
        return null;
    }

    @PutMapping("/entradas/{id}/recibir")
    public ResponseEntity<?> setRecibida(@PathVariable Long id) {
        Entrada entradaAux = entradasRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrada no encontrada"));
        if (entradaAux != null) {
            // Marcar la entrada como recibida y procesarla
            entradaAux.setEstado(true);
            return addEntrada(entradaAux);
        }
        return null;
    }

    @DeleteMapping("/entradas/{id}")
    public void deleteById(@PathVariable Long id) {
        entradasRepository.deleteById(id);
    }
}
