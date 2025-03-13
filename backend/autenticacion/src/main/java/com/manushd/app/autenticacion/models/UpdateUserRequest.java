package com.manushd.app.autenticacion.models;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRequest {
    private String newPassword;
    private String role; // Solo un rol
}


