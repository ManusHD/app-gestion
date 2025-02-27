package com.manushd.app.autenticacion;

import com.manushd.app.autenticacion.repository.UserRepository;
import com.manushd.app.autenticacion.repository.RoleRepository;
import com.manushd.app.autenticacion.models.User;
import com.manushd.app.autenticacion.models.Role;

import java.util.HashSet;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.HashSet;
import java.util.Set;


@SpringBootApplication
public class AutenticacionApplication {

    public static void main(String[] args) {
        SpringApplication.run(AutenticacionApplication.class, args);
    }

    @Bean
    CommandLineRunner init(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) { // Inyecta RoleRepository
        return args -> {
            userRepository.findByUsername("admin").ifPresentOrElse(admin -> {
                // Si el usuario ya existe, actualiza su contraseña (si es necesario)
                String encodedPassword = passwordEncoder.encode("admin");
                if (!encodedPassword.equals(admin.getPassword())) { // Compara si la contraseña ya está hasheada
                    admin.setPassword(encodedPassword);
                    userRepository.save(admin);
                }
            }, () -> {
                // Si no existe, crea el usuario
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin"));

                // ***SOLUCIÓN: Persiste el Role antes de asignarlo al User***
                Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseGet(() -> { // Busca el rol por nombre o crea uno nuevo si no existe
                    Role newRole = new Role();
                    newRole.setName("ROLE_ADMIN");
                    return roleRepository.save(newRole); // Guarda el rol y retorna la instancia persistida.
                });

                Set<Role> roles = new HashSet<>();
                roles.add(adminRole);
                admin.setRoles(roles);
                userRepository.save(admin);
            });
        };
    }
}
