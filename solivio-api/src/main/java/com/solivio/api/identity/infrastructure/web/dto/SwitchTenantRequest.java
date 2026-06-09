package com.solivio.api.identity.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;

public record SwitchTenantRequest(@NotBlank String tenantSlug) {}
