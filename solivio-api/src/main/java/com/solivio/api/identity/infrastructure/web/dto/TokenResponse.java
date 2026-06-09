package com.solivio.api.identity.infrastructure.web.dto;

import java.util.List;

public record TokenResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    List<TenantSummary> tenants,
    // Inclus dans le corps pour le mobile (SecureStore). Le web utilise le cookie HttpOnly.
    String refreshToken
) {
    public record TenantSummary(String slug, String nom, String role, String coordoType) {}

    public static TokenResponse of(String accessToken, long expiresIn,
            List<TenantSummary> tenants, String refreshToken) {
        return new TokenResponse(accessToken, "Bearer", expiresIn, tenants, refreshToken);
    }
}
