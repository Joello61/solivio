package com.solivio.api.inscription.infrastructure.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record TypeRoleRequest(
    @NotBlank @Size(max = 200) String libelle,
    UUID parentId
) {}
