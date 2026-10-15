package com.solivio.api.distribution.infrastructure.web.dto;

import java.time.LocalTime;
import java.util.UUID;

/**
 * Les places restantes tiennent compte de la capacite globale de la distribution.
 * Les effectifs ne sont donnes qu'a qui gere les distributions.
 */
public record CreneauResponse(
    UUID id,
    LocalTime heureDebut,
    LocalTime heureFin,
    int capacite,
    int placesRestantes,
    Integer confirmes,
    Integer enAttente
) {}
