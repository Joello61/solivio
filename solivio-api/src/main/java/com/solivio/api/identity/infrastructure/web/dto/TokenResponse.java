package com.solivio.api.identity.infrastructure.web.dto;

public record TokenResponse(
    String accessToken,
    String tokenType,
    long expiresIn,
    // Inclus dans le corps pour le mobile (SecureStore). Le web utilise le cookie HttpOnly.
    String refreshToken
) {

    public static TokenResponse of(String accessToken, long expiresIn, String refreshToken) {
        return new TokenResponse(accessToken, "Bearer", expiresIn, refreshToken);
    }
}
