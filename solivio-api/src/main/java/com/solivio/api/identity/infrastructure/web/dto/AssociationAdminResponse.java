package com.solivio.api.identity.infrastructure.web.dto;

import java.time.Instant;
import java.util.UUID;

public record AssociationAdminResponse(
    UUID id,
    String slug,
    String code,
    String nom,
    String statut,
    Instant dateCreation
) {}
