package com.solivio.api.distribution.infrastructure.web.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DistributionResponse(
    UUID id,
    String titre,
    String description,
    String lieu,
    LocalDate date,
    String statut,
    int capaciteBeneficiaires,
    Integer capaciteBenevoles,
    String modeCreneau,
    String baseRepartition,
    String motifAnnulation,
    Instant dateCreation,
    List<CreneauResponse> creneaux
) {}
