package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Finalisation de l'inscription via Google : lie le compte Google a une association.
 * Utilise par les nouveaux comptes Google qui n'ont pas encore rejoint d'association.
 */
public record GoogleCompleteRegistrationRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(max = 100) String nom,
    @NotBlank @Size(max = 100) String prenom,
    String codeAssociation,
    String tokenInvitation
) {}
