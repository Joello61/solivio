package com.solivio.api.repartition.infrastructure.web.dto;

import java.util.UUID;

public record DenreeResponse(
    UUID id,
    UUID distributionId,
    String libelle,
    String unite,
    int nombreContenants,
    double quantiteParContenant,
    double quantiteTotale
) {}
