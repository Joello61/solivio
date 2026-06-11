package com.solivio.api.collecte.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AnnulerMissionRequest(@NotBlank String raison) {}
