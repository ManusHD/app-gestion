package com.manushd.app.autenticacion.repository;

import com.manushd.app.autenticacion.models.Role;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

public interface RoleRepository extends CrudRepository<Role, Long> {

    Optional<Role> findByName(String name);
    
}
