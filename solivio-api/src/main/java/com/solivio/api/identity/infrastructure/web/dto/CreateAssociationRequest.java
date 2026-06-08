package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateAssociationRequest(
    @NotBlank @Size(min = 2, max = 100) String nom,
    @NotBlank
    @Size(min = 2, max = 63)
    @Pattern(
        regexp = "^[a-z0-9]+(-[a-z0-9]+)*$",
        message = "Le slug doit etre compose de lettres minuscules, chiffres et traits d'union"
    )
    String slug,
    @NotBlank @Email String emailResponsable
) {}
