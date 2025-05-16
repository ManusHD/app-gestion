package com.manushd.app.salidas;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.manushd.app.salidas.models.Salida;
import com.manushd.app.salidas.repository.SalidaRepository;

@SpringBootApplication
public class SalidasApplication {

    public static void main(String[] args) {
        SpringApplication.run(SalidasApplication.class, args);
    }

    @Bean
    CommandLineRunner inicializarRellena(SalidaRepository salidaRepository) {
        return args -> {
            List<Salida> salidas = salidaRepository.findAllByEstado(false);
			for (Salida salida : salidas) {
				boolean rellena = todosLosCamposRellenos(salida);
				salida.setRellena(rellena);
				salidaRepository.save(salida);
			}
        };
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
}

