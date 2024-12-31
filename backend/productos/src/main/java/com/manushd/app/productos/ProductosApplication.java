package com.manushd.app.productos;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.manushd.app.productos.models.Producto;
import com.manushd.app.productos.repository.ProductoRepository;

import jakarta.annotation.PostConstruct;

@SpringBootApplication
public class ProductosApplication {

	@Autowired
	ProductoRepository productosRepository;

	@PostConstruct
	private void init() {
		// Producto p1 = new Producto();
        // p1.setReferencia("8354456");
        // p1.setDescription("Pintalabios Rojo");
        // p1.setStock(45);

        // Producto p2 = new Producto();
        // p2.setReferencia("7545678");
        // p2.setDescription("Pintalabios Azul");
        // p2.setStock(10);

        // Producto p3 = new Producto();
        // p3.setReferencia("1234567");
        // p3.setDescription("Crema Hidratante");
        // p3.setStock(25);

        // Producto p4 = new Producto();
        // p4.setReferencia("7654321");
        // p4.setDescription("Sombras de Ojos");
        // p4.setStock(30);

        // Producto p5 = new Producto();
        // p5.setReferencia("9876543");
        // p5.setDescription("Base de Maquillaje");
        // p5.setStock(50);

        // Producto p6 = new Producto();
        // p6.setReferencia("2468135");
        // p6.setDescription("Corrector de Ojeras");
        // p6.setStock(15);

        // Producto p7 = new Producto();
        // p7.setReferencia("1357924");
        // p7.setDescription("Máscara de Pestañas");
        // p7.setStock(40);

        // Producto p8 = new Producto();
        // p8.setReferencia("1122334");
        // p8.setDescription("Esmalte de Uñas");
        // p8.setStock(20);

        // Producto p9 = new Producto();
        // p9.setReferencia("4433221");
        // p9.setDescription("Brocha para Maquillaje");
        // p9.setStock(35);

        // Producto p10 = new Producto();
        // p10.setReferencia("6677889");
        // p10.setDescription("Labial Mate");
        // p10.setStock(60);

        // productosRepository.save(p1);
        // productosRepository.save(p2);
        // productosRepository.save(p3);
        // productosRepository.save(p4);
        // productosRepository.save(p5);
        // productosRepository.save(p6);
        // productosRepository.save(p7);
        // productosRepository.save(p8);
        // productosRepository.save(p9);
        // productosRepository.save(p10);

	}


	public static void main(String[] args) {
		SpringApplication.run(ProductosApplication.class, args);
	}

}
