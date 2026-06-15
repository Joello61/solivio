package com.solivio.api.evenement.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ParticipationRequest(@NotBlank String role) {}
