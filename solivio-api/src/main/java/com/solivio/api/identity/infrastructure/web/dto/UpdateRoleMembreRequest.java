package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateRoleMembreRequest(
    @NotBlank
    @Pattern(regexp = "^(responsable|coordinateur|benevole|beneficiaire)$")
    String role,
    @Size(max = 50) String coordoType
) {}
