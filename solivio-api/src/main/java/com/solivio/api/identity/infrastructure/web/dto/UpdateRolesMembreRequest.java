package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Roles d'un membre fixes par un responsable ; responsable ne se cumule pas (ADR-012). */
public record UpdateRolesMembreRequest(
    @NotEmpty
    @Size(max = 3)
    List<@Pattern(regexp = "^(responsable|coordinateur|benevole|beneficiaire)$") String> roles,
    @Size(max = 50) String coordoType
) {}
