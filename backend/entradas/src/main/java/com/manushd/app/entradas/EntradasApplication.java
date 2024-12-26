package com.manushd.app.entradas;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.manushd.app.entradas.models.Entrada;
import com.manushd.app.entradas.models.ProductoEntrada;
import com.manushd.app.entradas.repository.EntradaRepository;
import com.manushd.app.entradas.repository.ProductoEntradaRepository;

import jakarta.annotation.PostConstruct;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

@SpringBootApplication
public class EntradasApplication {

	@Autowired
	private EntradaRepository entradasRepository;

	// @Autowired
	// private ProductoEntradaRepository productosEntradaRepository;

	@PostConstruct
	private void init() {

		// List<Entrada> entradas = new ArrayList<>();

        // // Entrada 1
        // Entrada entrada1 = new Entrada();
        // entrada1.setOrigen("Proveedor Maquillaje SA");
        // entrada1.setEstado(false);
        // ProductoEntrada producto1_1 = new ProductoEntrada(null, "123", "1001", "Base de maquillaje líquida", 50, null, null, null, null);
        // ProductoEntrada producto1_2 = new ProductoEntrada(null, null, "1002", "Paleta de sombras neutras", 30, null, null, null, null);
        // ProductoEntrada producto1_3 = new ProductoEntrada(null, "123", "1003", "Delineador negro a prueba de agua", 20, null, null, null, null);
        // Set<ProductoEntrada> set1 = new HashSet<>();
        // set1.add(producto1_1);
        // set1.add(producto1_2);
        // set1.add(producto1_3);
        // entrada1.setProductos(set1);

        // // Entrada 2
        // Entrada entrada2 = new Entrada();
        // entrada2.setOrigen("Distribuidora Cosméticos XYZ");
        // entrada2.setEstado(false);
        // ProductoEntrada producto2_1 = new ProductoEntrada(null, "126", "2001", "Máscara de pestañas voluminizadora", 40, null, null, null, null);
        // ProductoEntrada producto2_2 = new ProductoEntrada(null, "126", "2002", "Labial mate color rojo", 60, null, null, null, null);
        // ProductoEntrada producto2_3 = new ProductoEntrada(null, "126", "2003", "Rubor compacto color coral", 25, null, null, null, null);
        // Set<ProductoEntrada> set2 = new HashSet<>();
        // set2.add(producto2_1);
        // set2.add(producto2_2);
        // set2.add(producto2_3);
        // entrada2.setProductos(set2);

        // // Entrada 3
        // Entrada entrada3 = new Entrada();
        // entrada3.setOrigen("Proveedor Premium Makeup");
        // entrada3.setEstado(false);
        // ProductoEntrada producto3_1 = new ProductoEntrada(null, "129", "3001", "Iluminador líquido efecto natural", 15, null, null, null, null);
        // ProductoEntrada producto3_2 = new ProductoEntrada(null, null,"3002", "Spray fijador de maquillaje", 10, null, null, null, null);
        // ProductoEntrada producto3_3 = new ProductoEntrada(null, "129", "3003", "Polvo traslúcido efecto mate", 20, null, null, null, null);
        // ProductoEntrada producto3_4 = new ProductoEntrada(null, "129", "3004", "Corrector líquido alta cobertura", 30, null, null, null, null);
        // Set<ProductoEntrada> set3 = new HashSet<>();
        // set3.add(producto3_1);
        // set3.add(producto3_2);
        // set3.add(producto3_3);
        // set3.add(producto3_4);
        // entrada3.setProductos(set3);

        // // Entrada 3
        // Entrada entrada4 = new Entrada();
        // entrada4.setOrigen("Proveedor Extra de Primor");
        // entrada4.setEstado(false);
        // ProductoEntrada producto4_1 = new ProductoEntrada(null, "130", "3001", "Iluminador líquido efecto natural", 15, null, null, null, null);
        // ProductoEntrada producto4_2 = new ProductoEntrada(null, null,"3002", "Spray fijador de maquillaje", 10, null, null, null, null);
        // ProductoEntrada producto4_3 = new ProductoEntrada(null, "130", "3003", "Polvo traslúcido efecto mate", 20, null, null, null, null);
        // ProductoEntrada producto4_4 = new ProductoEntrada(null, "130", "3004", "Corrector líquido alta cobertura", 30, null, null, null, null);
        // Set<ProductoEntrada> set4 = new HashSet<>();
        // set4.add(producto4_1);
        // set4.add(producto4_2);
        // set4.add(producto4_3);
        // set4.add(producto4_4);
        // set4.add(producto1_2);
        // set4.add(producto3_2);
        // entrada4.setProductos(set4);

        // entradas.add(entrada1);
        // entradas.add(entrada2);
        // entradas.add(entrada3);
        // entradas.add(entrada4);

        // entradasRepository.saveAll(entradas);
    }

	public static void main(String[] args) {
		SpringApplication.run(EntradasApplication.class, args);
	}

}
