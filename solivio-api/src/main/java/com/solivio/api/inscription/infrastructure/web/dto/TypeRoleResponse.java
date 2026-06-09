package com.solivio.api.inscription.infrastructure.web.dto;

import java.util.List;
import java.util.UUID;

public record TypeRoleResponse(
    UUID id,
    UUID parentId,
    String libelle,
    boolean actif,
    List<TypeRoleResponse> sousTypes
) {}
