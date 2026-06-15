package com.solivio.api.reconditionnement.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PointageReconditionnementRequest(
    @NotNull UUID personneId,
    @NotBlank String presence
) {}
