package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Invitation d'une personne sans compte a devenir responsable (ADR-012). */
public record InviterMembreRequest(
    @NotBlank @Email String email
) {}
