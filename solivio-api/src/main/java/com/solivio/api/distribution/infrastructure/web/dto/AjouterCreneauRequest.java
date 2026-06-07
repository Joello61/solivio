package com.solivio.api.distribution.infrastructure.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalTime;

public record AjouterCreneauRequest(
    @NotNull LocalTime heureDebut,
    @NotNull LocalTime heureFin,
    @Positive int capacite
) {}
