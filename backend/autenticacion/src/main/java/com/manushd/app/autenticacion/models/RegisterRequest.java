package com.manushd.app.autenticacion.models;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    
    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @NotBlank
    private String role; // Debe ser "ADMIN" o "USER"
}
