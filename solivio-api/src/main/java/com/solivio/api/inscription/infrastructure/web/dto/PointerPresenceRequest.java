package com.solivio.api.inscription.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;

public record PointerPresenceRequest(
    @NotBlank String presence
) {}
