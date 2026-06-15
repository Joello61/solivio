package com.solivio.api.evenement.infrastructure.web.dto;

import java.time.ZonedDateTime;

public record UpdateEvenementRequest(
    String titre,
    String description,
    String type,
    String lieuPlaceId,
    String lieuAdresseFormatee,
    Double lieuLatitude,
    Double lieuLongitude,
    ZonedDateTime dateHeureDebut,
    ZonedDateTime dateHeureFin,
    Boolean aBesoiNStaff,
    Boolean ouvertParticipants,
    String publicParticipants,
    String modeInscription,
    Integer capaciteStaff,
    Integer capaciteParticipants
) {}
