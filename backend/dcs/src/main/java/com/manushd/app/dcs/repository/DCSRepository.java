package com.manushd.app.dcs.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

import com.manushd.app.dcs.models.DCS;

@RestResource(path="dcs", rel="dcs")
public interface DCSRepository extends CrudRepository <DCS, Long> {
    
    Optional<DCS> findByDcs(String dcs);

}
