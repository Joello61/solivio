package com.solivio.api.inscription.infrastructure.web.dto;

import java.util.UUID;

public record RoleBenevoleResponse(
    UUID id,
    UUID typeRoleId,
    String libelle
) {}
