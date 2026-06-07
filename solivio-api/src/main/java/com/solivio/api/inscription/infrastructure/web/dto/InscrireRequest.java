package com.solivio.api.inscription.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record InscrireRequest(
    @NotBlank String type,
    UUID creneauId
) {}
