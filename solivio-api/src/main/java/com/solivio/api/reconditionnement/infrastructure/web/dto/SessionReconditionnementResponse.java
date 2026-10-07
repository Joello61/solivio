package com.solivio.api.reconditionnement.infrastructure.web.dto;

import com.solivio.api.shared.lieu.LieuResponse;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.UUID;

public record SessionReconditionnementResponse(
    UUID id,
    String titre,
    String description,
    LieuResponse lieu,
    ZonedDateTime dateHeureDebut,
    ZonedDateTime dateHeureFin,
    Integer capacite,
    String statut,
    String motifAnnulation,
    int nbInscrits,
    Instant dateCreation
) {}
