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
    List<AffiliationSummary> affiliations
) {
    public record AffiliationSummary(
        String associationNom,
        String associationSlug,
        String role,
        String statut
    ) {}
}
