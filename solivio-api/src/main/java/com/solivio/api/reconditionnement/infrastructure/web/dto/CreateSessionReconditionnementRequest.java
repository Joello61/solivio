package com.solivio.api.reconditionnement.infrastructure.web.dto;

import com.solivio.api.shared.lieu.LieuRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.ZonedDateTime;

public record CreateSessionReconditionnementRequest(
    @NotBlank @Size(max = 200) String titre,
    String description,
    @Valid LieuRequest lieu,
    @NotNull ZonedDateTime dateHeureDebut,
    @NotNull ZonedDateTime dateHeureFin,
    Integer capacite
) {}
