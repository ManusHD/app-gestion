package com.manushd.app.entradas.controllers;

import com.manushd.app.entradas.models.Entrada;
import com.manushd.app.entradas.models.Producto;
import com.manushd.app.entradas.models.ProductoDcs;
import com.manushd.app.entradas.models.ProductoEntrada;
import com.manushd.app.entradas.repository.EntradaRepository;

import com.manushd.app.entradas.models.DCS;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.IntStream;

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

    @PostMapping("/entradas")
    public ResponseEntity<?> addEntrada(@RequestBody Entrada entrada) {
        if (entrada.getEstado()) {
            RestTemplate restTemplate = new RestTemplate();

            // Verificar y crear productos si no existen
            for (ProductoEntrada productoEntrada : entrada.getProductos()) {
                try {
                    // Intentar obtener el producto
                    ResponseEntity<Producto> response = restTemplate.getForEntity(
                            "http://localhost:8091/productos/referencia/" + productoEntrada.getRef(),
                            Producto.class);

                    if (productoEntrada.getUnidades() <= 0) {
                        throw new IllegalArgumentException("Los productos no pueden tener menos de 1 unidad");
                    } else if (response.getBody() == null) {
                        // Si no existe, crear el producto
                        Producto nuevoProducto = new Producto();
                        nuevoProducto.setReferencia(productoEntrada.getRef());
                        nuevoProducto.setDescription(productoEntrada.getDescription());
                        nuevoProducto.setStock(0); // Stock inicial en 0

                        // Llamar al endpoint para crear el producto
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
            crearDcs(entrada);
        }

        // Crear la entrada y actualizar stock
        Entrada savedEntrada = entradasRepository.save(entrada);

        if (entrada.getEstado()) {
            actualizarStockProductos(entrada.getProductos());
        }

        return ResponseEntity.ok(savedEntrada);
    }

    private void actualizarStockProductos(Iterable<ProductoEntrada> productos) {
        RestTemplate restTemplate = new RestTemplate();
        for (ProductoEntrada productoEntrada : productos) {
            try {
                String url = "http://localhost:8091/productos/" + productoEntrada.getRef() + "/sumar";
                restTemplate.exchange(
                        url,
                        HttpMethod.PUT,
                        new HttpEntity<>(productoEntrada.getUnidades()),
                        ProductoEntrada.class,
                        productoEntrada.getRef());
            } catch (Exception e) {
                throw new RuntimeException(
                        "Error al actualizar stock del producto " + productoEntrada.getRef() + ": " + e.getMessage());
            }
        }
    }

    private void crearDcs(Entrada entrada) {
        System.out.println("-------------------Creo DCS--------------------");
        List<DCS> ListaDcs = new ArrayList<>();
        RestTemplate restTemplate = new RestTemplate(); // Instancia de RestTemplate
    
        for (ProductoEntrada productoEntrada : entrada.getProductos()) {
            if (productoEntrada.getDcs() != null) {
                String numeroDcs = productoEntrada.getDcs();
                boolean existe = ListaDcs.stream().anyMatch(d -> d.getDcs().equals(numeroDcs));
    
                ProductoDcs p = new ProductoDcs();
                p.setRef(productoEntrada.getRef());
                p.setUnidades(productoEntrada.getUnidades());
    
                if (existe) {
                    int posicionDcs = IntStream.range(0, ListaDcs.size())
                            .filter(i -> ListaDcs.get(i).getDcs().equals(numeroDcs))
                            .findFirst()
                            .orElse(-1);
    
                    DCS dcsExistente = ListaDcs.get(posicionDcs);
                    if (dcsExistente.getProductos() == null) {
                        dcsExistente.setProductos(new HashSet<>());
                    }
                    dcsExistente.getProductos().add(p);
                } else {
                    DCS d = new DCS();
                    d.setDcs(numeroDcs);
                    d.setUsado(false);
                    d.setProductos(new HashSet<>());
                    d.getProductos().add(p);
                    ListaDcs.add(d);
                    
                }
            }
        }
        
        System.out.println("---------------------------------------");
        System.out.println(ListaDcs);
        System.out.println("---------------------------------------");
        
        // Enviar cada DCS al microservicio
        String url = "http://localhost:8094/dcs";
    
        for (DCS dcs : ListaDcs) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
    
                HttpEntity<DCS> request = new HttpEntity<>(dcs, headers);
                ResponseEntity<?> response = restTemplate.postForEntity(url, request, DCS.class);
    
                if (response.getStatusCode().is2xxSuccessful()) {
                    System.out.println("DCS creado exitosamente: " + response.getBody());
                } else {
                    System.out.println("Error al crear el DCS: " + dcs.getDcs());
                }
            } catch (Exception e) {
                System.out.println("Excepción al enviar el DCS: " + dcs.getDcs());
                e.printStackTrace();
            }
        }
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
            crearDcs(entradaAux);
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
