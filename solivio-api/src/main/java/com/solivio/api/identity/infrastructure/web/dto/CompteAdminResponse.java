package com.solivio.api.identity.infrastructure.web.dto;

import java.time.Instant;
import java.util.UUID;

public record CompteAdminResponse(
    UUID id,
    String email,
    String nom,
    String prenom,
    String photoUrl,
    boolean emailVerifie,
    boolean actif,
    boolean superAdmin,
    Instant dateCreation,
    // Role et statut du membre dans l'association ; nuls si le compte n'a pas de role.
    String role,
    String statutMembre
) {}
