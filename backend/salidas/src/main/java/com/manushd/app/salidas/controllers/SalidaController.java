package com.manushd.app.salidas.controllers;

import com.manushd.app.salidas.models.Salida;
import com.manushd.app.salidas.models.Ubicacion;
import com.manushd.app.salidas.models.Producto;
import com.manushd.app.salidas.models.ProductoSalida;
import com.manushd.app.salidas.models.ProductoUbicacion;
import com.manushd.app.salidas.repository.SalidaRepository;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Controller
@RestController
@CrossOrigin(value = "http://localhost:4200")
public class SalidaController {

    @Autowired
    private SalidaRepository salidasRepository;

    @GetMapping("/salidas")
    public Iterable<Salida> getSalidas() {
        return salidasRepository.findAll();
    }

    @GetMapping("/salidas/{id}")
    public Salida getSalidaById(@PathVariable Long id) {
        return salidasRepository.findById(id).orElse(null);
    }

    @GetMapping("/salidas/estado/{estado}")
    public Iterable<Salida> getSalidasByEstado(@PathVariable boolean estado) {
        return salidasRepository.findAllByEstadoOrderByFechaEnvioAsc(estado);
    }

    /**
     * Método para agregar una salida.
     * Se valida cada producto;
     * Para productos especiales ("VISUAL" o "SIN REFERENCIA") se omite la
     * verificación en el microservicio de Productos.
     */
    @PostMapping("/salidas")
    public ResponseEntity<?> addSalida(@RequestBody Salida salida) {
        List<Ubicacion> ubicacionesList = new ArrayList<>();
        RestTemplate restTemplate = new RestTemplate();

        System.out.println("=====================================");
        System.out.println("SALIDA");
        System.out.println(salida);
        
        if (Boolean.TRUE.equals(salida.getEstado())) {
            System.out.println("Entro en el IF");
            // Lista para almacenar las ubicaciones (únicas) de la salida
            List<String> nombresUbicaciones = new ArrayList<>();

            // Validar cada producto de la salida
            for (ProductoSalida productoSalida : salida.getProductos()) {
                System.out.println("-------------------------------------");
                System.out.println(productoSalida);

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

                    String ref = productoSalida.getRef();

                    // Para productos normales se valida existencia y stock en el microservicio de Productos
                    if (!isProductoEspecial(ref)) {
                        ResponseEntity<Producto> response = restTemplate.getForEntity(
                                "http://localhost:8091/productos/referencia/" + ref,
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
                        // Se utiliza ArrayList para evitar deduplicación automática de productos especiales
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
            ResponseEntity<Ubicacion[]> responseUbicaciones = restTemplate.getForEntity(
                    "http://localhost:8095/ubicaciones",
                    Ubicacion[].class);
            Ubicacion[] ubicacionesArray = responseUbicaciones.getBody();

            if (ubicacionesArray == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error al obtener las ubicaciones.");
            } else {
                // Para cada ubicación de la salida se comprueba el stock existente en el almacén
                for (Ubicacion ubicacionSalida : ubicacionesList) {
                    boolean ubicacionEncontrada = false;
                    for (Ubicacion ubicacionActual : ubicacionesArray) {
                        if (ubicacionActual.getNombre().equals(ubicacionSalida.getNombre())) {
                            ubicacionEncontrada = true;
                            // Para cada producto solicitado en la salida
                            for (ProductoUbicacion productoSalidaUb : ubicacionSalida.getProductos()) {
                                boolean stockSuficiente = false;
                                // Si el producto es especial se delega la comprobación en el microservicio
                                // Ubicaciones (o se puede omitir la verificación aquí)
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

            // Actualizar el stock de cada ubicación llamando al endpoint /ubicaciones/restar
            for (Ubicacion ubicacion : ubicacionesList) {
                System.out.println("=================UBICACION LISTA SALIDA===============");
                System.out.println(ubicacion);
                try {
                    ResponseEntity<Ubicacion> response = restTemplate.exchange(
                            "http://localhost:8095/ubicaciones/restar",
                            HttpMethod.POST,
                            new HttpEntity<>(ubicacion),
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

    @PutMapping("/salidas/{id}")
    public Salida updateSalida(@PathVariable Long id, @RequestBody Salida salida) {
        Salida salidaAux = salidasRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Salida no encontrada"));
        if (salidaAux != null) {
            return salidasRepository.save(salida);
        }
        return null;
    }

    @PutMapping("/salidas/{id}/enviar")
    public ResponseEntity<?> setEnviada(@PathVariable Long id) {
        Salida salidaAux = salidasRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Salida no encontrada"));
        if (salidaAux != null) {
            salidaAux.setEstado(true);
            return addSalida(salidaAux);
        }
        return null;
    }

    @DeleteMapping("/salidas/{id}")
    public void deleteById(@PathVariable Long id) {
        salidasRepository.deleteById(id);
    }

    // Método auxiliar para identificar productos especiales
    private boolean isProductoEspecial(String ref) {
        return "VISUAL".equalsIgnoreCase(ref) || "SIN REFERENCIA".equalsIgnoreCase(ref);
    }
}
