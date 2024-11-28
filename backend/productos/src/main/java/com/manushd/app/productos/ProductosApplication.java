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
		Producto p = new Producto();
		p.setReferencia("468354456");
		p.setDescription("Pintalabios Rojo");
		p.setStock(45);
		
		Producto p2 = new Producto();
		p2.setReferencia("67754567");
		p2.setDescription("Pintalabios Azul");
		p2.setStock(10);

		productosRepository.save(p);
		productosRepository.save(p2);

	}


	public static void main(String[] args) {
		SpringApplication.run(ProductosApplication.class, args);
	}

}
