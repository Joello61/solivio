package com.solivio.api.evenement.infrastructure.web.dto;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.UUID;

public record EvenementResponse(
    UUID id,
    String titre,
    String description,
    String type,
    String lieuPlaceId,
    String lieuAdresseFormatee,
    Double lieuLatitude,
    Double lieuLongitude,
    ZonedDateTime dateHeureDebut,
    ZonedDateTime dateHeureFin,
    boolean aBesoiNStaff,
    boolean ouvertParticipants,
    String publicParticipants,
    String modeInscription,
    Integer capaciteStaff,
    Integer capaciteParticipants,
    String statut,
    String raisonAnnulation,
    int nbStaff,
    int nbParticipants,
    Instant dateCreation
) {}
