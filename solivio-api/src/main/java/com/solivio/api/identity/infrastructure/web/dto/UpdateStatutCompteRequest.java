package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateStatutCompteRequest(@NotNull Boolean actif) {}
