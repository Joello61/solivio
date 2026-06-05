package com.solivio.api.identity.infrastructure.web.dto;

import java.util.List;

public record MeResponse(
    String id,
    String email,
    String nom,
    String prenom,
    boolean superAdmin,
    String tenantActif,
    List<String> roles
) {}
