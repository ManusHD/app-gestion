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
                Object.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ Previsión de salida creada automáticamente para implantación de muebles");
            } else {
                System.err.println("❌ Error en respuesta de salidas: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Error al crear previsión de salida: " + e.getClass().getSimpleName() + " - " + e.getMessage());
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
                Object.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ Previsión de entrada creada automáticamente para retirada de muebles");
            } else {
                System.err.println("❌ Error en respuesta de entradas: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("❌ Error al crear previsión de entrada: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al crear previsión de entrada: " + e.getMessage(), e);
        }
    }

    private HttpHeaders createHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        headers.set("Content-Type", "application/json");
        headers.set("Accept", "application/json");
        return headers;
    }

    private SalidaDTO construirSalidaDTO(Mueble mueble) {
        SalidaDTO salidaDTO = new SalidaDTO();
        salidaDTO.setDestino(determinarDestino(mueble));
        salidaDTO.setPerfumeria(mueble.getPerfumeria());
        salidaDTO.setPdv(mueble.getPdv());
        salidaDTO.setDireccion(mueble.getDireccion());
        salidaDTO.setPoblacion(mueble.getPoblacion());
        salidaDTO.setProvincia(mueble.getProvincia());
        salidaDTO.setCp(mueble.getCp());
        salidaDTO.setTelefono(mueble.getTelefono());
        salidaDTO.setEstado(false); // Previsión
        salidaDTO.setRellena(false);
        
        // Convertir LocalDate a String
        LocalDate fechaEnvio = mueble.getFechaRealizacion() != null ? mueble.getFechaRealizacion() : LocalDate.now();
        salidaDTO.setFechaEnvio(fechaEnvio.toString());

        // Convertir productos
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
        entradaDTO.setOrigen(determinarDestino(mueble));
        entradaDTO.setPerfumeria(mueble.getPerfumeria());
        entradaDTO.setPdv(mueble.getPdv());
        entradaDTO.setColaborador(null);
        entradaDTO.setDcs(null);
        entradaDTO.setEstado(false); // Previsión
        
        // Convertir LocalDate a String
        LocalDate fechaRecepcion = mueble.getFechaRealizacion() != null ? mueble.getFechaRealizacion() : LocalDate.now();
        entradaDTO.setFechaRecepcion(fechaRecepcion.toString());

        // Convertir productos
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

    private String determinarDestino(Mueble mueble) {
        if (mueble.getPerfumeria() != null && !mueble.getPerfumeria().isEmpty()) {
            return mueble.getPerfumeria() + (mueble.getPdv() != null ? " - " + mueble.getPdv() : "");
        } else if (mueble.getOtroDestino() != null && !mueble.getOtroDestino().isEmpty()) {
            return mueble.getOtroDestino();
        }
        return "Destino no especificado";
    }
}