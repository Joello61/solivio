package com.solivio.api.evenement.infrastructure.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ParticipationEvenementResponse(
    UUID id,
    UUID evenementId,
    String evenementTitre,
    java.time.ZonedDateTime evenementDate,
    String evenementLieu,
    UUID personneId,
    String personneNomComplet,
    String role,
    String presence,
    Instant dateInscription
) {}
