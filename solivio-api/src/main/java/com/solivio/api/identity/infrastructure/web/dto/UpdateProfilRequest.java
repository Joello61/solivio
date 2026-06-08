package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfilRequest(
    @Size(max = 100) String nom,
    @Size(max = 100) String prenom,
    @Size(max = 30) String telephone
) {}
