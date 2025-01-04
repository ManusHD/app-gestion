package com.manushd.app.dcs.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.dcs.models.ProductoDcs;

@RestResource(path = "productosDcs", rel = "dcs")
public interface ProductoDcsRepository extends CrudRepository<ProductoDcs, Long> {
    
}
