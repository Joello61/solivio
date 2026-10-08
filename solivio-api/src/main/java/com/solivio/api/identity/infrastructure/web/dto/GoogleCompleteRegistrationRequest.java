package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Finalisation de l'inscription via Google : donne un role au compte Google
 * (beneficiaire par defaut, ou celui de l'invitation).
 */
public record GoogleCompleteRegistrationRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(max = 100) String nom,
    @NotBlank @Size(max = 100) String prenom,
    String tokenInvitation
) {}
