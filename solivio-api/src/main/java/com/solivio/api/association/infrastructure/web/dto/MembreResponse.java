package com.solivio.api.association.infrastructure.web.dto;

import java.time.LocalDate;
import java.util.UUID;

public record MembreResponse(
    UUID compteId,
    String nom,
    String prenom,
    String email,
    String role,
    String coordoType,
    String statut,
    LocalDate dateDebut
) {}
