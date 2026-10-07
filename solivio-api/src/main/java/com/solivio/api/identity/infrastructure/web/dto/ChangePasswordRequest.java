package com.solivio.api.identity.infrastructure.web.dto;

import com.solivio.api.identity.infrastructure.web.validation.MotDePasseRobuste;
import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(
    @NotBlank String motDePasseActuel,
    @NotBlank @MotDePasseRobuste String nouveauMotDePasse
) {}
