package com.solivio.api.distribution.infrastructure.web.dto;

import java.time.LocalTime;
import java.util.UUID;

public record CreneauResponse(
    UUID id,
    LocalTime heureDebut,
    LocalTime heureFin,
    int capacite
) {}
