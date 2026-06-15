package com.solivio.api.inscription.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AjouterVisiteurRequest(
    @NotBlank @Size(max = 100) String nom,
    @NotBlank @Size(max = 100) String prenom,
    @Size(max = 255) String email,
    @Size(max = 100) String role
) {}
