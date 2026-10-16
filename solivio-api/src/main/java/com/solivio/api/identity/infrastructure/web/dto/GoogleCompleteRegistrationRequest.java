package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Finalisation de l'inscription via Google : donne au compte les roles choisis
 * (comme RegisterRequest), ou celui de l'invitation.
 */
public record GoogleCompleteRegistrationRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(max = 100) String nom,
    @NotBlank @Size(max = 100) String prenom,
    @Size(max = 2) List<@NotBlank String> roles,
    boolean attestationEtudiant,
    String tokenInvitation
) {}
