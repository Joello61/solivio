package com.solivio.api.evenement.infrastructure.web.dto;

import com.solivio.api.shared.web.Assainissement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.ZonedDateTime;

public record CreateEvenementRequest(
    @NotBlank @Size(max = 200) String titre,
    @Size(max = Assainissement.TEXTE_LONG_MAX) String description,
    @Size(max = 20) String type,
    @Size(max = 500) String lieuPlaceId,
    @Size(max = 500) String lieuAdresseFormatee,
    Double lieuLatitude,
    Double lieuLongitude,
    @NotNull ZonedDateTime dateHeureDebut,
    @NotNull ZonedDateTime dateHeureFin,
    Boolean aBesoiNStaff,
    Boolean ouvertParticipants,
    @Size(max = 20) String publicParticipants,
    @Size(max = 25) String modeInscription,
    @PositiveOrZero Integer capaciteStaff,
    @PositiveOrZero Integer capaciteParticipants
) {}
