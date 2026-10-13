package com.solivio.api.distribution.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ChangerBaseRepartitionRequest(
    @NotBlank @Pattern(regexp = "^(INSCRITS|PRESENTS)$") String base
) {}
