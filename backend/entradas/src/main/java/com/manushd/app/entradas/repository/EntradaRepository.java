package com.manushd.app.entradas.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.entradas.models.Entrada;

@RestResource(path="entradas", rel="entrada")
public interface EntradaRepository extends CrudRepository<Entrada, Long>{
    
}
