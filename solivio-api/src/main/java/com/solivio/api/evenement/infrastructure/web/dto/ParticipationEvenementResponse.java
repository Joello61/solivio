package com.solivio.api.evenement.infrastructure.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ParticipationEvenementResponse(
    UUID id,
    UUID evenementId,
    UUID personneId,
    String personneNomComplet,
    String role,
    String presence,
    Instant dateInscription
) {}
