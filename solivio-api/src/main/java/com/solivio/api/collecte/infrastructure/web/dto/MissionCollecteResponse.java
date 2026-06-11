package com.solivio.api.collecte.infrastructure.web.dto;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.UUID;

public record MissionCollecteResponse(
    UUID id,
    String titre,
    String description,
    LieuMissionResponse lieuCollecte,
    LieuMissionResponse lieuDepot,
    ZonedDateTime dateHeure,
    int capacitePersonnes,
    String statut,
    UUID benevoleId,
    String benevoleNomComplet,
    ZonedDateTime datePriseEnCharge,
    ZonedDateTime dateCollecteEffectuee,
    ZonedDateTime dateDepotValide,
    String raisonAnnulation,
    Instant dateCreation
) {}
