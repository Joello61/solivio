package com.solivio.api.collecte.infrastructure.web.dto;

import com.solivio.api.shared.web.Assainissement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.ZonedDateTime;

public record UpdateMissionCollecteRequest(
    @Size(max = 200) String titre,
    @Size(max = Assainissement.TEXTE_LONG_MAX) String description,
    @Valid LieuMissionRequest lieuCollecte,
    @Valid LieuMissionRequest lieuDepot,
    ZonedDateTime dateHeure,
    @Min(1) Integer capacitePersonnes
) {}
