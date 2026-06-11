package com.solivio.api.identity.infrastructure.web.dto;

import java.time.Instant;
import java.util.List;

public record MeResponse(
    String id,
    String email,
    String nom,
    String prenom,
    String telephone,
    String photoUrl,
    boolean superAdmin,
    String tenantActif,
    List<String> roles,
    Instant dateCreation,
    Instant dateModification,
    boolean emailVerifie,
    String authMethod
) {}
