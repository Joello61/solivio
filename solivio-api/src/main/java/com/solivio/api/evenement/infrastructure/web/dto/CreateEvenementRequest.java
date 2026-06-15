package com.solivio.api.evenement.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.ZonedDateTime;

public record CreateEvenementRequest(
    @NotBlank String titre,
    String description,
    String type,
    String lieuPlaceId,
    String lieuAdresseFormatee,
    Double lieuLatitude,
    Double lieuLongitude,
    @NotNull ZonedDateTime dateHeureDebut,
    @NotNull ZonedDateTime dateHeureFin,
    Boolean aBesoiNStaff,
    Boolean ouvertParticipants,
    String publicParticipants,
    String modeInscription,
    Integer capaciteStaff,
    Integer capaciteParticipants
) {}
