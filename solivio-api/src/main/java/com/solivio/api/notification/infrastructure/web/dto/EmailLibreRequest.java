package com.solivio.api.notification.infrastructure.web.dto;

import com.solivio.api.notification.domain.CibleEmail;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EmailLibreRequest(
    @NotNull CibleEmail cible,
    @NotBlank String sujet,
    @NotBlank String corps
) {}
