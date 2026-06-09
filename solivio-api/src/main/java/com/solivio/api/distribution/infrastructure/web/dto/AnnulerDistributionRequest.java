package com.solivio.api.distribution.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AnnulerDistributionRequest(
    @NotBlank String motif
) {}
