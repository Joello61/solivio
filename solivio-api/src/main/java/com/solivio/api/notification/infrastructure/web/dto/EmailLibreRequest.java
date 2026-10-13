package com.solivio.api.notification.infrastructure.web.dto;

import com.solivio.api.notification.domain.CibleEmail;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EmailLibreRequest(
    @NotNull CibleEmail cible,
    @NotBlank @Size(max = 200) String sujet,
    @NotBlank @Size(max = EmailLibreRequest.CORPS_MAX) String corps
) {

    public static final int CORPS_MAX = 10_000;
}
