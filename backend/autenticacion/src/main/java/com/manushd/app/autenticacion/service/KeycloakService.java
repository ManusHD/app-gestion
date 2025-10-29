package com.manushd.app.autenticacion.service;

import com.manushd.app.autenticacion.config.KeycloakConfig;
import com.manushd.app.autenticacion.models.RegisterRequest;
import com.manushd.app.autenticacion.models.UpdateUserRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.*;

@Service
public class KeycloakService {

    @Autowired
    private WebClient webClient;

    @Autowired
    private KeycloakConfig keycloakConfig;

    private String adminToken = null;
    private long tokenExpiry = 0;

    private Mono<String> getAdminToken() {
        if (adminToken != null && System.currentTimeMillis() < tokenExpiry) {
            System.out.println("✅ Usando token de admin cacheado");
            return Mono.just(adminToken);
        }

        System.out.println("🔑 Solicitando nuevo token de administrador...");
        System.out.println("Client ID: " + keycloakConfig.getClientId());
        System.out.println("Token URL: " + keycloakConfig.getKeycloakTokenUrl() + "/token");

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "client_credentials");
        formData.add("client_id", keycloakConfig.getClientId());
        formData.add("client_secret", keycloakConfig.getClientSecret());

        return WebClient.create(keycloakConfig.getKeycloakTokenUrl())
                .post()
                .uri("/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(formData))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(response -> {
                    adminToken = (String) response.get("access_token");
                    Integer expiresIn = (Integer) response.get("expires_in");
                    tokenExpiry = System.currentTimeMillis() + (expiresIn * 1000L) - 60000;
                    System.out.println("✅ Token de administrador obtenido correctamente");
                    return adminToken;
                })
                .doOnError(error -> {
                    System.err.println("❌ Error al obtener token de administrador: " + error.getMessage());
                });
    }

    public Mono<List<Map<String, Object>>> getUsers() {
        return getAdminToken()
                .flatMap(token -> webClient.get()
                        .uri("/admin/realms/delim/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                        .flatMap(user -> getUserWithRoles(token, (String) user.get("id"), user))
                        .collectList());
    }

    private Mono<Map<String, Object>> getUserWithRoles(String token, String userId, Map<String, Object> user) {
        return webClient.get()
                .uri("/admin/realms/delim/users/" + userId + "/role-mappings/realm")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(role -> {
                    Map<String, Object> roleMap = new HashMap<>();
                    roleMap.put("name", role.get("name"));
                    return roleMap;
                })
                .collectList()
                .map(roles -> {
                    user.put("roles", roles);
                    return user;
                })
                .onErrorReturn(user);
    }

    public Mono<Map<String, Object>> registerUser(RegisterRequest request) {
        Map<String, Object> keycloakUser = new HashMap<>();
        keycloakUser.put("username", request.getUsername());
        keycloakUser.put("enabled", true);
        keycloakUser.put("emailVerified", false);

        Map<String, Object> credential = new HashMap<>();
        credential.put("type", "password");
        credential.put("value", request.getPassword());
        credential.put("temporary", false);
        keycloakUser.put("credentials", Collections.singletonList(credential));

        return getAdminToken()
                .flatMap(token -> webClient.post()
                        .uri("/admin/realms/delim/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(keycloakUser)
                        .retrieve()
                        .onStatus(
                            status -> status.is4xxClientError() || status.is5xxServerError(),
                            response -> response.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    System.err.println("Error de Keycloak: " + errorBody);
                                    String errorMessage = "Error al crear usuario";
                                    
                                    if (errorBody.contains("User exists")) {
                                        errorMessage = "El usuario ya existe";
                                    } else if (errorBody.contains("username")) {
                                        errorMessage = "Nombre de usuario no válido";
                                    }
                                    
                                    return Mono.error(new RuntimeException(errorMessage));
                                })
                        )
                        .toBodilessEntity()
                        .flatMap(response -> webClient.get()
                                .uri(uriBuilder -> uriBuilder
                                        .path("/admin/realms/delim/users")
                                        .queryParam("username", request.getUsername())
                                        .build())
                                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                .retrieve()
                                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                                .next()
                                .flatMap(user -> {
                                    String userId = (String) user.get("id");
                                    // Eliminar SOLO el rol default-roles-delim y asignar el rol correcto
                                    return removeUnwantedRealmRoles(token, userId)
                                            .then(assignRoleToUser(token, userId, request.getRole()))
                                            .thenReturn(user);
                                })));
    }

    private Mono<Void> removeUnwantedRealmRoles(String token, String userId) {
        return webClient.get()
                .uri("/admin/realms/delim/users/" + userId + "/role-mappings/realm")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .filter(role -> {
                    String roleName = (String) role.get("name");
                    // SOLO eliminar el rol default-roles-delim
                    return roleName != null && roleName.equals("default-roles-delim");
                })
                .collectList()
                .flatMap(rolesToRemove -> {
                    if (rolesToRemove.isEmpty()) {
                        System.out.println("✅ No hay roles 'default-roles-delim' para eliminar");
                        return Mono.empty();
                    }
                    
                    System.out.println("🗑️  Eliminando rol: default-roles-delim");
                    return webClient.method(org.springframework.http.HttpMethod.DELETE)
                            .uri("/admin/realms/delim/users/" + userId + "/role-mappings/realm")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(rolesToRemove)
                            .retrieve()
                            .toBodilessEntity()
                            .then()
                            .doOnSuccess(v -> System.out.println("✅ Rol 'default-roles-delim' eliminado correctamente"));
                })
                .onErrorResume(error -> {
                    System.err.println("⚠️  Error al eliminar rol por defecto: " + error.getMessage());
                    return Mono.empty(); // No fallar la creación del usuario si no se puede eliminar el rol
                });
    }
    
    private Mono<Void> assignRoleToUser(String token, String userId, String roleName) {
        return webClient.get()
                .uri("/admin/realms/delim/roles")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .filter(role -> roleName.equals(role.get("name")))
                .next()
                .flatMap(role -> {
                    List<Map<String, Object>> roles = Collections.singletonList(role);
                    return webClient.post()
                            .uri("/admin/realms/delim/users/" + userId + "/role-mappings/realm")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(roles)
                            .retrieve()
                            .toBodilessEntity()
                            .then();
                });
    }

    public Mono<Map<String, Object>> updateUser(String username, UpdateUserRequest request) {
        return getAdminToken()
                .flatMap(token -> webClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/admin/realms/delim/users")
                                .queryParam("username", username)
                                .build())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                        .next()
                        .flatMap(user -> {
                            String userId = (String) user.get("id");
                            Mono<Void> updatePassword = Mono.empty();
                            Mono<Void> updateRole = Mono.empty();

                            if (request.getNewPassword() != null && !request.getNewPassword().trim().isEmpty()) {
                                Map<String, Object> credential = new HashMap<>();
                                credential.put("type", "password");
                                credential.put("value", request.getNewPassword());
                                credential.put("temporary", false);

                                updatePassword = webClient.put()
                                        .uri("/admin/realms/delim/users/" + userId + "/reset-password")
                                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .bodyValue(credential)
                                        .retrieve()
                                        .toBodilessEntity()
                                        .then();
                            }

                            if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
                                updateRole = removeCurrentRoles(token, userId)
                                        .then(assignRoleToUser(token, userId, request.getRole()));
                            }

                            return Mono.when(updatePassword, updateRole).thenReturn(user);
                        }));
    }

    private Mono<Void> removeCurrentRoles(String token, String userId) {
        return webClient.get()
                .uri("/admin/realms/delim/users/" + userId + "/role-mappings/realm")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                .collectList()
                .flatMap(currentRoles -> {
                    if (currentRoles.isEmpty()) {
                        return Mono.empty();
                    }
                    return webClient.method(org.springframework.http.HttpMethod.DELETE)
                            .uri("/admin/realms/delim/users/" + userId + "/role-mappings/realm")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(currentRoles)
                            .retrieve()
                            .toBodilessEntity()
                            .then();
                });
    }

    public Mono<Void> deleteUser(String username) {
        return getAdminToken()
                .flatMap(token -> webClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/admin/realms/delim/users")
                                .queryParam("username", username)
                                .build())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .retrieve()
                        .bodyToFlux(new ParameterizedTypeReference<Map<String, Object>>() {})
                        .next()
                        .flatMap(user -> {
                            String userId = (String) user.get("id");
                            return webClient.delete()
                                    .uri("/admin/realms/delim/users/" + userId)
                                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                                    .retrieve()
                                    .toBodilessEntity()
                                    .then();
                        }));
    }
}