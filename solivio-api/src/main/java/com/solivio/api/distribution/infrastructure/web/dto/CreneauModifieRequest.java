package com.solivio.api.distribution.infrastructure.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalTime;
import java.util.UUID;

/** Creneau d'une distribution modifiee : id absent pour un nouveau creneau. */
public record CreneauModifieRequest(
    UUID id,
    @NotNull LocalTime heureDebut,
    @NotNull LocalTime heureFin,
    @Positive int capacite
) {}
