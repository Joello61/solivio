package com.solivio.api.association.infrastructure.web.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateAssociationRequest(
    @Size(min = 2, max = 255) String nom,
    @Size(max = 500) String logoUrl,
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String couleurPrimaire,
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String couleurSecondaire,
    @Size(max = 50) String fuseauHoraire,
    Integer frequenceMaxParSemaine,
    @Size(max = 255) String contactEmail,
    @Size(max = 30) String contactTelephone
) {}
