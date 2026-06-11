package com.solivio.api.reconditionnement.infrastructure.web.dto;

import java.time.Instant;
import java.util.UUID;

public record InscriptionReconditionnementResponse(
    UUID id,
    UUID sessionId,
    UUID personneId,
    String nomComplet,
    String statut,
    String presence,
    Instant dateInscription
) {}
