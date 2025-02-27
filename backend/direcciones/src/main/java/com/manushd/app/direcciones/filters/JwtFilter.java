package com.manushd.app.direcciones.filters;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.io.IOException;
import java.security.Key;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.beans.factory.annotation.Value;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

public class JwtFilter extends OncePerRequestFilter {
    private final String jwtSecret;

    public JwtFilter(String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        Key signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        String username = claims.getSubject();
        List<String> roles = claims.get("roles", List.class);

        if (username != null) {
            List<GrantedAuthority> authorities = roles.stream()
                    .map(role -> {
                        // Si el rol ya tiene el prefijo ROLE_, no lo añadimos otra vez
                        if (role.startsWith("ROLE_")) {
                            return new SimpleGrantedAuthority(role);  // Si ya tiene ROLE_, no añadimos otro "ROLE_"
                        } else {
                            return new SimpleGrantedAuthority("ROLE_" + role);  // Si no tiene ROLE_, lo añadimos
                        }
                    })
                    .collect(Collectors.toList());
        
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(username, null, authorities);
            
            // Se establece la autenticación en el contexto
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }
        
        

        chain.doFilter(request, response);
    }
}
