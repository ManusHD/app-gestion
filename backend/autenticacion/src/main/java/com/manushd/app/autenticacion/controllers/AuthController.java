package com.manushd.app.autenticacion.controllers;

import com.manushd.app.autenticacion.models.RegisterRequest;
import com.manushd.app.autenticacion.models.UpdateUserRequest;
import com.manushd.app.autenticacion.service.KeycloakService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private KeycloakService keycloakService;

    @GetMapping("/usuarios")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getUsers(Authentication authentication) {
        System.out.println("Usuario autenticado: " + authentication.getName());
        System.out.println("Authorities: " + authentication.getAuthorities());
        
        return keycloakService.getUsers()
                .map(ResponseEntity::ok)
                .onErrorResume(e -> {
                    System.err.println("Error al obtener usuarios: " + e.getMessage());
                    e.printStackTrace();
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    @PostMapping("/registrar")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Mono<ResponseEntity<Map<String, String>>> registerUser(@RequestBody RegisterRequest request) {
        return keycloakService.registerUser(request)
                .map(user -> {
                    Map<String, String> response = new HashMap<>();
                    response.put("message", "Usuario " + request.getUsername() + " registrado correctamente.");
                    return ResponseEntity.ok(response);
                })
                .onErrorResume(e -> {
                    System.err.println("Error al registrar usuario: " + e.getMessage());
                    e.printStackTrace();
                    
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", e.getMessage());
                    
                    return Mono.just(ResponseEntity.badRequest().body(errorResponse));
                });
    }

    @PutMapping("/actualizar/{username}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Mono<ResponseEntity<Map<String, String>>> updateUser(@PathVariable String username, @RequestBody UpdateUserRequest request) {
        return keycloakService.updateUser(username, request)
                .map(user -> {
                    Map<String, String> response = new HashMap<>();
                    response.put("message", "Usuario actualizado correctamente.");
                    return ResponseEntity.ok(response);
                })
                .onErrorResume(e -> {
                    System.err.println("Error al actualizar usuario: " + e.getMessage());
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", e.getMessage());
                    return Mono.just(ResponseEntity.badRequest().body(errorResponse));
                });
    }

    @DeleteMapping("/eliminar/{username}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Mono<ResponseEntity<Map<String, String>>> deleteUser(@PathVariable String username) {
        return keycloakService.deleteUser(username)
                .then(Mono.fromCallable(() -> {
                    Map<String, String> response = new HashMap<>();
                    response.put("message", "Usuario eliminado correctamente.");
                    return ResponseEntity.ok(response);
                }))
                .onErrorResume(e -> {
                    System.err.println("Error al eliminar usuario: " + e.getMessage());
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", e.getMessage());
                    return Mono.just(ResponseEntity.badRequest().body(errorResponse));
                });
    }
}