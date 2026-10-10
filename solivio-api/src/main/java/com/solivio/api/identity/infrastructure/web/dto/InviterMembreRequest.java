package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record InviterMembreRequest(
    @NotBlank @Email String email,
    @NotBlank @Pattern(regexp = "^(responsable|coordinateur|benevole)$") String role,
    String coordoType
) {}
