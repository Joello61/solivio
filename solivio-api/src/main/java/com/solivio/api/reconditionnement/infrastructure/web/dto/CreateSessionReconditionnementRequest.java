package com.solivio.api.reconditionnement.infrastructure.web.dto;

import com.solivio.api.shared.lieu.LieuRequest;
import com.solivio.api.shared.web.Assainissement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.ZonedDateTime;

public record CreateSessionReconditionnementRequest(
    @NotBlank @Size(max = 200) String titre,
    @Size(max = Assainissement.TEXTE_LONG_MAX) String description,
    @Valid LieuRequest lieu,
    @NotNull ZonedDateTime dateHeureDebut,
    @NotNull ZonedDateTime dateHeureFin,
    @PositiveOrZero Integer capacite
) {}
