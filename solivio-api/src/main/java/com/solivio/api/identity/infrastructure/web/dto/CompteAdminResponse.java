package com.solivio.api.identity.infrastructure.web.dto;

import java.time.Instant;
import java.util.List;
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
    // Roles et statut du membre dans l'association ; vides ou nul si le compte n'en a pas.
    List<String> roles,
    String statutMembre
) {}
