package com.manushd.app.autenticacion.repository;

import com.manushd.app.autenticacion.models.User;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RestResource;

@RestResource(path = "users", rel="user")
public interface UserRepository extends CrudRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);
}
