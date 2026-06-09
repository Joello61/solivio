package com.solivio.api.association.infrastructure.web.dto;

import java.time.Instant;
import java.util.UUID;

public record AssociationResponse(
    UUID id,
    String slug,
    String code,
    String nom,
    String statut,
    String logoUrl,
    String couleurPrimaire,
    String couleurSecondaire,
    String fuseauHoraire,
    Integer frequenceMaxParSemaine,
    String contactEmail,
    String contactTelephone,
    Instant dateCreation
) {}
