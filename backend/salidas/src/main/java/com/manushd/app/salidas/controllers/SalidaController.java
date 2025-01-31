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
        return salidasRepository.findAllByEstado(estado);
    }

    @PostMapping("/salidas")
    public ResponseEntity<?> addSalida(@RequestBody Salida salida) {
        List<Ubicacion> ubicacionesList = new ArrayList<>();
        if (salida.getEstado()) {
            RestTemplate restTemplate = new RestTemplate();

            // Crear una lista de ubicaciones únicas
            List<String> ubicaciones = new ArrayList<>();

            // Validar los productos
            // Comprueba que todos los parámetros de los productos de la Salida están
            // correctos
            for (ProductoSalida productoSalida : salida.getProductos()) {
                try {
                    if (salida.getFechaEnvio() == null) {
                        throw new IllegalArgumentException("La fecha de envío no puede estar en blanco.");
                    } else if (productoSalida.getUnidades() <= 0) {
                        throw new IllegalArgumentException("Las unidades deben ser mayores a 0.");
                    } else if (productoSalida.getRef().isEmpty() || productoSalida.getRef().isBlank()) {
                        throw new IllegalArgumentException("La referencia del producto no puede estar en blanco.");
                    }

                    // Obtener el producto por referencia
                    ResponseEntity<Producto> response = restTemplate.getForEntity(
                            "http://localhost:8091/productos/referencia/" + productoSalida.getRef(),
                            Producto.class);

                    Producto producto = response.getBody();

                    if (producto == null) {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body("El producto con referencia " + productoSalida.getRef() + " no existe.");
                    } else if (producto.getStock() < productoSalida.getUnidades()) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("No hay suficiente stock del producto con referencia " + productoSalida.getRef()
                                        + " en la ubicación " + productoSalida.getUbicacion());
                    }

                    // Comprobar si la ubicación ya está en la lista, sino la crea
                    if (!ubicaciones.contains(productoSalida.getUbicacion())) {
                        ubicaciones.add(productoSalida.getUbicacion());
                        ProductoUbicacion productoUbicacion = new ProductoUbicacion();
                        productoUbicacion.setRef(productoSalida.getRef());
                        productoUbicacion.setUnidades(productoSalida.getUnidades());

                        Ubicacion u = new Ubicacion();
                        u.setNombre(productoSalida.getUbicacion());
                        u.setProductos(new HashSet<>());
                        u.getProductos().add(productoUbicacion);
                        ubicacionesList.add(u);
                    } else {
                        for (Ubicacion ubicacion : ubicacionesList) {
                            if (ubicacion.getNombre().equals(productoSalida.getUbicacion())) {
                                ProductoUbicacion productoUbicacion = new ProductoUbicacion();
                                productoUbicacion.setRef(productoSalida.getRef());
                                productoUbicacion.setUnidades(productoSalida.getUnidades());
                                ubicacion.getProductos().add(productoUbicacion);
                            }
                        }
                    }

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

            // Obtener todas las ubicaciones del endpoint
            ResponseEntity<Ubicacion[]> responseUbicaciones = restTemplate.getForEntity(
                    "http://localhost:8095/ubicaciones",
                    Ubicacion[].class);

            Ubicacion[] ubicacionesArray = responseUbicaciones.getBody();

            if (ubicacionesArray == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error al obtener las ubicaciones.");
            } else {
                // Comprobar que haya suficiente stock de cada producto en ubicacionesList
                for (Ubicacion ubicacion : ubicacionesList) {
                    for (ProductoUbicacion productoUbicacion : ubicacion.getProductos()) {
                        boolean stockSuficiente = false;
                        for (Ubicacion u : ubicacionesArray) {
                            if (u.getNombre().equals(ubicacion.getNombre())) {
                                for (ProductoUbicacion pu : u.getProductos()) {
                                    if (pu.getRef().equals(productoUbicacion.getRef())
                                            && pu.getUnidades() >= productoUbicacion.getUnidades()) {
                                        stockSuficiente = true;
                                        break;
                                    }
                                }
                            }
                            if (stockSuficiente) {
                                break;
                            }
                        }
                        if (!stockSuficiente) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("No hay suficiente stock del producto con referencia "
                                            + productoUbicacion.getRef() + " en la ubicación " + ubicacion.getNombre());
                        }
                    }
                }
            }

            // Actualizar el stock de los productos
            for (Ubicacion ubicacion : ubicacionesList) {
                try {
                    ResponseEntity<Ubicacion> response = restTemplate.exchange(
                            "http://localhost:8095/ubicaciones/restar",
                            HttpMethod.POST,
                            new HttpEntity<>(ubicacion),
                            Ubicacion.class);
                } catch (HttpClientErrorException e) {
                    // Capturar el mensaje de error del cuerpo de la respuesta
                    String errorMessage = e.getResponseBodyAsString();
                    return ResponseEntity.status(e.getStatusCode())
                            .body(errorMessage);
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("Error inesperado: " + e.getMessage());
                }
            }
        }

        // Crear la salida y actualizar stock
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
}
