package com.solivio.api.inscription.infrastructure.web.dto;

import java.time.Instant;
import java.util.UUID;

public record PointageAdHocResponse(
    UUID id,
    String nom,
    String prenom,
    String email,
    String role,
    String presence,
    boolean invitationEnvoyee,
    Instant datePointage
) {}
