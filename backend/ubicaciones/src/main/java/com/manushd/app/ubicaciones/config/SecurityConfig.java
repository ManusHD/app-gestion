package com.manushd.app.ubicaciones.config;

import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.manushd.app.ubicaciones.filters.JwtFilter;

import org.springframework.security.config.Customizer;
import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.beans.factory.annotation.Value;




@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)  // Habilita @PreAuthorize en métodos o clases
public class SecurityConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .cors(Customizer.withDefaults()) // Configura CORS
            .csrf(csrf -> csrf.disable()) // Desactiva CSRF si no lo necesitas
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // JWT no usa sesiones
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/ubicaciones/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_OPERADOR") // Rutas protegidas
                .anyRequest().authenticated()
            )
            .addFilterBefore(new JwtFilter(jwtSecret), UsernamePasswordAuthenticationFilter.class) // Agregar el filtro antes de UsernamePasswordAuthenticationFilter
            .build();
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOriginPatterns("http://localhost:4200", "https://chanel.delim.es", "https://api.chanel.delim.es") // Permite más variantes de origen
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") 
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }

}

