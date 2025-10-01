package com.manushd.app.muebles.controllers;

import com.manushd.app.muebles.models.*;
import com.manushd.app.muebles.repository.MuebleRepository;

import com.manushd.app.muebles.service.MicroserviceCommunicationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
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

@RestController
@RequestMapping("/muebles")
@PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
public class MuebleController {

    @Autowired
    private MuebleRepository muebleRepository;

    @Autowired
    private MicroserviceCommunicationService communicationService;

    @GetMapping("")
    public Page<Mueble> getMuebles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return muebleRepository.findAll(PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public Mueble getMuebleById(@PathVariable Long id) {
        return muebleRepository.findById(id).orElse(null);
    }

    @GetMapping("/estado/{estado}")
    public Iterable<Mueble> getMueblesByEstado(@PathVariable boolean estado) {
        return muebleRepository.findAllByEstadoOrderByFechaOrdenTrabajoDesc(estado);
    }

    @GetMapping("/estado/{estado}/paginado")
    public Page<Mueble> getMueblesByEstadoPaginado(
            @PathVariable boolean estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return muebleRepository.findAllByEstadoOrderByFechaOrdenTrabajoDesc(
                estado, PageRequest.of(page, size));
    }

    @GetMapping("/filtrar/paginado")
    public ResponseEntity<Page<Mueble>> filtrarMueblesPaginado(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam String tipoBusqueda,
            @RequestParam(required = false) String textoBusqueda,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<Mueble> muebles = buscarMueblesFiltradasPaginado(
                fechaInicio, fechaFin, tipoBusqueda, textoBusqueda,
                PageRequest.of(page, size));

        return ResponseEntity.ok(muebles);
    }

    @GetMapping("/filtrar")
    public ResponseEntity<Iterable<Mueble>> filtrarMuebles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam String tipoBusqueda,
            @RequestParam(required = false) String textoBusqueda) {

        Iterable<Mueble> muebles = buscarMueblesFiltradas(
                fechaInicio, fechaFin, tipoBusqueda, textoBusqueda);

        return ResponseEntity.ok(muebles);
    }

    private Page<Mueble> buscarMueblesFiltradasPaginado(
            LocalDate fechaInicio, LocalDate fechaFin, String tipoBusqueda,
            String textoBusqueda, Pageable pageable) {

        if (textoBusqueda == null || textoBusqueda.trim().isEmpty()) {
            return muebleRepository.findByFechaOrdenTrabajoBetweenAndEstadoOrderByFechaOrdenTrabajoDesc(
                    fechaInicio, fechaFin, true, pageable);
        }

        switch (tipoBusqueda) {
            case "referencia":
                return muebleRepository.findByFechaAndReferenciaOrderByFechaOrdenTrabajoDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            case "descripcion":
                return muebleRepository.findByFechaAndDescripcionOrderByFechaOrdenTrabajoDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            case "destino":
                return muebleRepository.findByFechaAndDestinoOrderByFechaOrdenTrabajoDesc(
                        fechaInicio, fechaFin, textoBusqueda, pageable);
            default:
                return muebleRepository.findByFechaOrdenTrabajoBetweenAndEstadoOrderByFechaOrdenTrabajoDesc(
                        fechaInicio, fechaFin, true, pageable);
        }
    }

    private Iterable<Mueble> buscarMueblesFiltradas(
            LocalDate fechaInicio, LocalDate fechaFin, String tipoBusqueda, String textoBusqueda) {

        if (textoBusqueda == null || textoBusqueda.trim().isEmpty()) {
            return muebleRepository.findByFechaOrdenTrabajoBetweenAndEstadoOrderByFechaOrdenTrabajoDesc(
                    fechaInicio, fechaFin, true);
        }

        switch (tipoBusqueda) {
            case "referencia":
                return muebleRepository.findByFechaAndReferenciaOrderByFechaOrdenTrabajoDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            case "descripcion":
                return muebleRepository.findByFechaAndDescripcionOrderByFechaOrdenTrabajoDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            case "destino":
                return muebleRepository.findByFechaAndDestinoOrderByFechaOrdenTrabajoDesc(
                        fechaInicio, fechaFin, textoBusqueda);
            default:
                return muebleRepository.findByFechaOrdenTrabajoBetweenAndEstadoOrderByFechaOrdenTrabajoDesc(
                        fechaInicio, fechaFin, true);
        }
    }

    @PostMapping("")
    public ResponseEntity<?> addMueble(@RequestBody Mueble mueble, @RequestHeader("Authorization") String token) {
        try {
            // Calcular coste total automáticamente
            calcularCosteTotal(mueble);

            // Validar stock si es implantación
            if (mueble.getTipoAccion() == Mueble.TipoAccion.IMPLANTACION) {
                validarStockParaImplantacion(mueble, token);
            }

            // Guardar el mueble
            Mueble savedMueble = muebleRepository.save(mueble);
            System.out.println("✅ Trabajo de muebles guardado con ID: " + savedMueble.getId());

            return ResponseEntity.ok(savedMueble);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ Error general al procesar trabajo de muebles: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al procesar el trabajo de mueble: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Mueble updateMueble(@PathVariable Long id, @RequestBody Mueble mueble) {
        Mueble muebleAux = muebleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trabajo de mueble no encontrado"));
        
        // Calcular coste total automáticamente
        calcularCosteTotal(mueble);
        
        return muebleRepository.save(mueble);
    }

    @PutMapping("/{id}/realizar")
    public ResponseEntity<?> marcarComoRealizado(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        Mueble muebleAux = muebleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trabajo de mueble no encontrado"));
        
        // Validaciones antes de marcar como realizado
        if (muebleAux.getFechaPrevistaRealizacion() == null) {
            return ResponseEntity.badRequest().body("La fecha prevista de realización es obligatoria");
        }
        
        if (muebleAux.getCosteColaborador() == null || muebleAux.getCosteEnvio() == null) {
            return ResponseEntity.badRequest().body("Los costes son obligatorios antes de marcar como realizado");
        }
        
        if (muebleAux != null) {
            muebleAux.setEstado(true);
            if (muebleAux.getFechaRealizacion() == null) {
                muebleAux.setFechaRealizacion(LocalDate.now());
            }

            // Crear previsión automática según tipo de acción
            try {
                if (muebleAux.getTipoAccion() == Mueble.TipoAccion.IMPLANTACION) {
                    communicationService.crearPrevisionSalida(muebleAux, token);
                } else if (muebleAux.getTipoAccion() == Mueble.TipoAccion.RETIRADA) {
                    communicationService.crearPrevisionEntrada(muebleAux, token);
                } else if (muebleAux.getTipoAccion() == Mueble.TipoAccion.INTERCAMBIO) {
                    communicationService.crearPrevisionesIntercambio(muebleAux, token);
                }
            } catch (Exception e) {
                System.err.println("⚠️  Trabajo de muebles creado, pero error al crear previsión automática: " + e.getMessage());
                return ResponseEntity.ok()
                    .header("Warning", "Trabajo creado pero error al generar previsión automática")
                    .body(muebleAux);
            }

            return ResponseEntity.ok(muebleRepository.save(muebleAux));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteById(@PathVariable Long id) {
        muebleRepository.deleteById(id);
    }

    private void calcularCosteTotal(Mueble mueble) {
        BigDecimal costeColaborador = mueble.getCosteColaborador() != null ? mueble.getCosteColaborador() : BigDecimal.ZERO;
        BigDecimal costeEnvio = mueble.getCosteEnvio() != null ? mueble.getCosteEnvio() : BigDecimal.ZERO;
        mueble.setCosteTotal(costeColaborador.add(costeEnvio));
    }

    private void validarStockParaImplantacion(Mueble mueble, String token) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);

        for (ProductoMueble producto : mueble.getProductos()) {
            try {
                String url = "http://localhost:8091/productos/referencia/" + producto.getRef() + "/estado/" + producto.getEstado();
                HttpEntity<String> entity = new HttpEntity<>(headers);
                
                ResponseEntity<Producto> response = restTemplate.exchange(url, HttpMethod.GET, entity, Producto.class);
                Producto productoStock = response.getBody();

                if (productoStock == null) {
                    throw new IllegalArgumentException("El producto " + producto.getRef() + " con estado " + producto.getEstado() + " no existe");
                }

                if (productoStock.getStock() < producto.getUnidades()) {
                    throw new IllegalArgumentException("Stock insuficiente para " + producto.getRef() + 
                            " estado " + producto.getEstado() + ". Disponible: " + productoStock.getStock() + 
                            ", Solicitado: " + producto.getUnidades());
                }

            } catch (Exception e) {
                throw new IllegalArgumentException("Error al validar stock: " + e.getMessage());
            }
        }
    }
}