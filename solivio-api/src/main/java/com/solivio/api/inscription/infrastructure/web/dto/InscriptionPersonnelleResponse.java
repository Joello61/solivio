package com.solivio.api.inscription.infrastructure.web.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Vue de l'inscription du point de vue de l'utilisateur : enrichie du titre
 * et de la date de la distribution, sans donnees sur les autres inscrits.
 */
public record InscriptionPersonnelleResponse(
    UUID id,
    UUID distributionId,
    String distributionTitre,
    LocalDate distributionDate,
    String distributionLieu,
    String type,
    String statut,
    Integer rangListeAttente,
    String presence,
    Instant dateInscription
) {}
