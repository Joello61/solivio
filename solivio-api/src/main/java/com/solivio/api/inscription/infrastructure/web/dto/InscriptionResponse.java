package com.solivio.api.inscription.infrastructure.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record InscriptionResponse(
    UUID id,
    UUID distributionId,
    UUID creneauId,
    String nom,
    String prenom,
    String type,
    String statut,
    Integer rangListeAttente,
    List<RoleBenevoleResponse> roles,
    String presence,
    Instant dateInscription,
    // RG4 : nombre d'absences passees, visible du coordinateur. 0 pour les benevoles.
    long nombreAbsencesPassees
) {}
