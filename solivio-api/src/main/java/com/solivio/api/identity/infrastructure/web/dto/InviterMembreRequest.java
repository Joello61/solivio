package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record InviterMembreRequest(
    @NotBlank @Email String email,
    @NotBlank String role,
    String coordoType
) {}
