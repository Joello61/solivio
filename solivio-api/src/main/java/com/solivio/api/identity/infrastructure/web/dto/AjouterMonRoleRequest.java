package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Role qu'un membre s'ajoute ; beneficiaire suppose l'attestation d'etudiant inscrit. */
public record AjouterMonRoleRequest(
    @NotBlank @Pattern(regexp = "^(benevole|beneficiaire)$") String role,
    boolean attestationEtudiant
) {}
