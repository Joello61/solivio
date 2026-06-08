package com.solivio.api.association.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateStatutMembreRequest(
    @NotBlank
    @Pattern(regexp = "actif|suspendu")
    String statut
) {}
