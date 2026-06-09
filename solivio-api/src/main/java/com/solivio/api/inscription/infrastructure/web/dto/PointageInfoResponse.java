package com.solivio.api.inscription.infrastructure.web.dto;

import java.time.LocalTime;
import java.util.UUID;

// Confidentiel : nom + prenom uniquement, aucune donnee sensible (profil_beneficiaire exclu).
public record PointageInfoResponse(
    UUID inscriptionId,
    String nom,
    String prenom,
    String type,
    String statut,
    String presence,
    LocalTime heureCreneauDebut,
    LocalTime heureCreneauFin
) {}
