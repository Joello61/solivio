package com.solivio.api.inscription.infrastructure.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AjouterBenevoleExistantRequest(
    @NotNull UUID personneId
) {}
