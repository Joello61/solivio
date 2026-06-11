package com.solivio.api.reconditionnement.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AnnulerSessionRequest(@NotBlank String motif) {}
