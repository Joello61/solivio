package com.solivio.api.identity.infrastructure.web.dto;

// refreshToken est optionnel : les clients web utilisent le cookie HttpOnly.
// Les clients mobiles peuvent passer le token dans le body JSON.
public record RefreshTokenRequest(String refreshToken) {}
