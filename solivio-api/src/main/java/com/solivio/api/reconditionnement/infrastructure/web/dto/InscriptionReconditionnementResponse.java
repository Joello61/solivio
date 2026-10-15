package com.solivio.api.reconditionnement.infrastructure.web.dto;

import java.time.Instant;
import java.util.UUID;

public record InscriptionReconditionnementResponse(
    UUID id,
    UUID sessionId,
    String sessionTitre,
    java.time.ZonedDateTime sessionDate,
    String sessionLieu,
    String sessionStatut,
    UUID personneId,
    String nomComplet,
    String statut,
    String presence,
    Instant dateInscription
) {}
