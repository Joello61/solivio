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
    // Compare a la personne qui consulte : le frontend ne connait que l'id du compte.
    boolean assigneAuLecteur,
    ZonedDateTime datePriseEnCharge,
    ZonedDateTime dateCollecteEffectuee,
    ZonedDateTime dateDepotValide,
    String raisonAnnulation,
    Instant dateCreation
) {}
