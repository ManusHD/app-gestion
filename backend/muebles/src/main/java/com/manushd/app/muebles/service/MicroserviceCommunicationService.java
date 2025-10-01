package com.manushd.app.muebles.service;

import com.manushd.app.muebles.dto.*;
import com.manushd.app.muebles.models.Mueble;
import com.manushd.app.muebles.models.ProductoMueble;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Service
public class MicroserviceCommunicationService {

    private final RestTemplate restTemplate;

    public MicroserviceCommunicationService() {
        this.restTemplate = new RestTemplate();
    }

    public void crearPrevisionSalida(Mueble mueble, String token) {
        HttpHeaders headers = createHeaders(token);

        SalidaDTO salidaDTO = construirSalidaDTO(mueble);

        try {
            HttpEntity<SalidaDTO> request = new HttpEntity<>(salidaDTO, headers);
            ResponseEntity<Object> response = restTemplate.exchange(
                    "http://localhost:8093/salidas",
                    HttpMethod.POST,
                    request,
                    Object.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ Previsión de salida creada automáticamente para implantación de muebles");
            } else {
                System.err.println("❌ Error en respuesta de salidas: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println(
                    "❌ Error al crear previsión de salida: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al crear previsión de salida: " + e.getMessage(), e);
        }
    }

    public void crearPrevisionEntrada(Mueble mueble, String token) {
        HttpHeaders headers = createHeaders(token);

        EntradaDTO entradaDTO = construirEntradaDTO(mueble);

        try {
            HttpEntity<EntradaDTO> request = new HttpEntity<>(entradaDTO, headers);
            ResponseEntity<Object> response = restTemplate.exchange(
                    "http://localhost:8092/entradas",
                    HttpMethod.POST,
                    request,
                    Object.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ Previsión de entrada creada automáticamente para retirada de muebles");
            } else {
                System.err.println("❌ Error en respuesta de entradas: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println(
                    "❌ Error al crear previsión de entrada: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al crear previsión de entrada: " + e.getMessage(), e);
        }
    }

    public void crearPrevisionesIntercambio(Mueble mueble, String token) {
        HttpHeaders headers = createHeaders(token);

        // Crear previsión de entrada con productos de retirada
        EntradaDTO entradaDTO = construirEntradaDTOIntercambio(mueble, true);

        try {
            HttpEntity<EntradaDTO> requestEntrada = new HttpEntity<>(entradaDTO, headers);
            ResponseEntity<Object> responseEntrada = restTemplate.exchange(
                    "http://localhost:8092/entradas",
                    HttpMethod.POST,
                    requestEntrada,
                    Object.class);

            if (responseEntrada.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ Previsión de entrada creada automáticamente para intercambio de muebles");
            }
        } catch (Exception e) {
            System.err.println("❌ Error al crear previsión de entrada en intercambio: " + e.getMessage());
            throw new RuntimeException("Error al crear previsión de entrada: " + e.getMessage(), e);
        }

        // Crear previsión de salida con productos de implantación
        SalidaDTO salidaDTO = construirSalidaDTOIntercambio(mueble, false);

        try {
            HttpEntity<SalidaDTO> requestSalida = new HttpEntity<>(salidaDTO, headers);
            ResponseEntity<Object> responseSalida = restTemplate.exchange(
                    "http://localhost:8093/salidas",
                    HttpMethod.POST,
                    requestSalida,
                    Object.class);

            if (responseSalida.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ Previsión de salida creada automáticamente para intercambio de muebles");
            }
        } catch (Exception e) {
            System.err.println("❌ Error al crear previsión de salida en intercambio: " + e.getMessage());
            throw new RuntimeException("Error al crear previsión de salida: " + e.getMessage(), e);
        }
    }

    private HttpHeaders createHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        headers.set("Content-Type", "application/json");
        headers.set("Accept", "application/json");
        return headers;
    }

    private String determinarDestino(Mueble mueble) {
        StringBuilder destino = new StringBuilder();

        if (mueble.getPerfumeria() != null && !mueble.getPerfumeria().isEmpty()) {
            destino.append(mueble.getPerfumeria());
            if (mueble.getPdv() != null && !mueble.getPdv().isEmpty()) {
                destino.append(" - ").append(mueble.getPdv());
            }
        } else if (mueble.getColaborador() != null && !mueble.getColaborador().isEmpty()) {
            destino.append(mueble.getColaborador());
        } else if (mueble.getOtroDestino() != null && !mueble.getOtroDestino().isEmpty()) {
            destino.append(mueble.getOtroDestino());
        } else {
            destino.append("Destino no especificado");
        }

        return destino.toString();
    }

    private SalidaDTO construirSalidaDTO(Mueble mueble) {
        SalidaDTO salidaDTO = new SalidaDTO();

        // Determinar el destino principal
        String destinoPrincipal = determinarDestino(mueble);
        salidaDTO.setDestino(destinoPrincipal);

        // Solo rellenar perfumeria y pdv si están definidos
        if (mueble.getPerfumeria() != null && !mueble.getPerfumeria().isEmpty()) {
            salidaDTO.setPerfumeria(mueble.getPerfumeria());
            salidaDTO.setPdv(mueble.getPdv());
        }

        // Solo rellenar colaborador si está definido Y no hay perfumería
        if (mueble.getColaborador() != null && !mueble.getColaborador().isEmpty() &&
                (mueble.getPerfumeria() == null || mueble.getPerfumeria().isEmpty())) {
            salidaDTO.setColaborador(mueble.getColaborador());
        }

        salidaDTO.setDireccion(mueble.getDireccion());
        salidaDTO.setPoblacion(mueble.getPoblacion());
        salidaDTO.setProvincia(mueble.getProvincia());
        salidaDTO.setCp(mueble.getCp());
        salidaDTO.setTelefono(mueble.getTelefono());
        salidaDTO.setEstado(false);
        salidaDTO.setRellena(false);

        LocalDate fechaEnvio = mueble.getFechaRealizacion() != null ? mueble.getFechaRealizacion() : LocalDate.now();
        salidaDTO.setFechaEnvio(fechaEnvio.toString());

        Set<ProductoSalidaDTO> productosSalida = new HashSet<>();
        for (ProductoMueble pm : mueble.getProductos()) {
            ProductoSalidaDTO ps = new ProductoSalidaDTO();
            ps.setRef(pm.getRef());
            ps.setDescription(pm.getDescription());
            ps.setEstado(pm.getEstado());
            ps.setUnidades(pm.getUnidades());
            ps.setUnidadesPedidas(pm.getUnidades());
            ps.setPalets(0);
            ps.setBultos(0);
            ps.setFormaEnvio("");
            ps.setObservaciones("Generado automáticamente desde trabajo de muebles ID: " + mueble.getId());
            ps.setComprobado(false);
            productosSalida.add(ps);
        }
        salidaDTO.setProductos(productosSalida);

        return salidaDTO;
    }

    private EntradaDTO construirEntradaDTO(Mueble mueble) {
        EntradaDTO entradaDTO = new EntradaDTO();

        // Determinar el origen principal
        String origenPrincipal = determinarDestino(mueble);
        entradaDTO.setOrigen(origenPrincipal);

        // Solo rellenar perfumeria y pdv si están definidos
        if (mueble.getPerfumeria() != null && !mueble.getPerfumeria().isEmpty()) {
            entradaDTO.setPerfumeria(mueble.getPerfumeria());
            entradaDTO.setPdv(mueble.getPdv());
        }

        // Solo rellenar colaborador si está definido Y no hay perfumería
        if (mueble.getColaborador() != null && !mueble.getColaborador().isEmpty() &&
                (mueble.getPerfumeria() == null || mueble.getPerfumeria().isEmpty())) {
            entradaDTO.setColaborador(mueble.getColaborador());
        }

        entradaDTO.setDcs(null);
        entradaDTO.setEstado(false);

        LocalDate fechaRecepcion = mueble.getFechaRealizacion() != null ? mueble.getFechaRealizacion()
                : LocalDate.now();
        entradaDTO.setFechaRecepcion(fechaRecepcion.toString());

        Set<ProductoEntradaDTO> productosEntrada = new HashSet<>();
        for (ProductoMueble pm : mueble.getProductos()) {
            ProductoEntradaDTO pe = new ProductoEntradaDTO();
            pe.setRef(pm.getRef());
            pe.setDescription(pm.getDescription());
            pe.setEstado(pm.getEstado());
            pe.setUnidades(pm.getUnidades());
            pe.setUbicacion("");
            pe.setPalets(0);
            pe.setBultos(0);
            pe.setObservaciones("Generado automáticamente desde trabajo de muebles ID: " + mueble.getId());
            pe.setComprobado(false);
            productosEntrada.add(pe);
        }
        entradaDTO.setProductos(productosEntrada);

        return entradaDTO;
    }

    private EntradaDTO construirEntradaDTOIntercambio(Mueble mueble, boolean esRetirada) {
        EntradaDTO entradaDTO = new EntradaDTO();

        // Determinar el origen principal
        String origenPrincipal = determinarDestino(mueble);
        entradaDTO.setOrigen(origenPrincipal);

        // Solo rellenar perfumeria y pdv si están definidos
        if (mueble.getPerfumeria() != null && !mueble.getPerfumeria().isEmpty()) {
            entradaDTO.setPerfumeria(mueble.getPerfumeria());
            entradaDTO.setPdv(mueble.getPdv());
        }

        // Solo rellenar colaborador si está definido Y no hay perfumería
        if (mueble.getColaborador() != null && !mueble.getColaborador().isEmpty() &&
                (mueble.getPerfumeria() == null || mueble.getPerfumeria().isEmpty())) {
            entradaDTO.setColaborador(mueble.getColaborador());
        }

        entradaDTO.setDcs(null);
        entradaDTO.setEstado(false);

        LocalDate fechaRecepcion = mueble.getFechaRealizacion() != null ? mueble.getFechaRealizacion()
                : LocalDate.now();
        entradaDTO.setFechaRecepcion(fechaRecepcion.toString());

        Set<ProductoEntradaDTO> productosEntrada = new HashSet<>();
        for (ProductoMueble pm : mueble.getProductos()) {
            if (pm.getEsRetirada() != null && pm.getEsRetirada() == esRetirada) {
                ProductoEntradaDTO pe = new ProductoEntradaDTO();
                pe.setRef(pm.getRef());
                pe.setDescription(pm.getDescription());
                pe.setEstado(pm.getEstado());
                pe.setUnidades(pm.getUnidades());
                pe.setUbicacion("");
                pe.setPalets(0);
                pe.setBultos(0);
                pe.setObservaciones("Generado automáticamente desde intercambio de muebles");
                pe.setComprobado(false);
                productosEntrada.add(pe);
            }
        }
        entradaDTO.setProductos(productosEntrada);

        return entradaDTO;
    }

    private SalidaDTO construirSalidaDTOIntercambio(Mueble mueble, boolean esRetirada) {
        SalidaDTO salidaDTO = new SalidaDTO();

        // Determinar el destino principal
        String destinoPrincipal = determinarDestino(mueble);
        salidaDTO.setDestino(destinoPrincipal);

        // Solo rellenar perfumeria y pdv si están definidos
        if (mueble.getPerfumeria() != null && !mueble.getPerfumeria().isEmpty()) {
            salidaDTO.setPerfumeria(mueble.getPerfumeria());
            salidaDTO.setPdv(mueble.getPdv());
        }

        // Solo rellenar colaborador si está definido Y no hay perfumería
        if (mueble.getColaborador() != null && !mueble.getColaborador().isEmpty() &&
                (mueble.getPerfumeria() == null || mueble.getPerfumeria().isEmpty())) {
            salidaDTO.setColaborador(mueble.getColaborador());
        }

        salidaDTO.setDireccion(mueble.getDireccion());
        salidaDTO.setPoblacion(mueble.getPoblacion());
        salidaDTO.setProvincia(mueble.getProvincia());
        salidaDTO.setCp(mueble.getCp());
        salidaDTO.setTelefono(mueble.getTelefono());
        salidaDTO.setEstado(false);
        salidaDTO.setRellena(false);

        LocalDate fechaEnvio = mueble.getFechaRealizacion() != null ? mueble.getFechaRealizacion() : LocalDate.now();
        salidaDTO.setFechaEnvio(fechaEnvio.toString());

        Set<ProductoSalidaDTO> productosSalida = new HashSet<>();
        for (ProductoMueble pm : mueble.getProductos()) {
            if (pm.getEsRetirada() != null && pm.getEsRetirada() == esRetirada) {
                ProductoSalidaDTO ps = new ProductoSalidaDTO();
                ps.setRef(pm.getRef());
                ps.setDescription(pm.getDescription());
                ps.setEstado(pm.getEstado());
                ps.setUnidades(pm.getUnidades());
                ps.setUnidadesPedidas(pm.getUnidades());
                ps.setPalets(0);
                ps.setBultos(0);
                ps.setFormaEnvio("");
                ps.setObservaciones("Generado automáticamente desde intercambio de muebles");
                ps.setComprobado(false);
                productosSalida.add(ps);
            }
        }
        salidaDTO.setProductos(productosSalida);

        return salidaDTO;
    }
}