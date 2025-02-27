package com.manushd.app.autenticacion.controllers;

import com.manushd.app.autenticacion.models.LoginRequest;
import com.manushd.app.autenticacion.models.LoginResponse;
import com.manushd.app.autenticacion.models.RegisterRequest;
import com.manushd.app.autenticacion.models.User;
import com.manushd.app.autenticacion.service.UserDetailsServiceImpl;
import com.manushd.app.autenticacion.util.JwtUtil;
import com.manushd.app.autenticacion.util.LoginAttemptService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserDetailsServiceImpl userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoginAttemptService loginAttemptService;

    @PostMapping("/registrar")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        try {
            User user = userService.registerUser(request);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Usuario " + user.getUsername() + " registrado correctamente.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest loginRequest) {
        String username = loginRequest.getUsername();
        if (loginAttemptService.isBlocked(username)) {
            throw new RuntimeException("Usuario bloqueado temporalmente por múltiples intentos fallidos");
        }
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, loginRequest.getPassword())
            );
            // Si la autenticación es exitosa, se resetea el contador
            loginAttemptService.loginSucceeded(username);

            // Obtener roles
            List<String> roles = authentication.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

            String token = jwtUtil.generateJwtToken(username, roles);
            return new LoginResponse(token);
        } catch (AuthenticationException e) {
            loginAttemptService.loginFailed(username);
            throw new RuntimeException("Credenciales inválidas");
        }
    }
}
