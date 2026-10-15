package com.solivio.api.distribution.infrastructure.web.dto;

/**
 * Remplissage d'une distribution. Les places restantes sont donnees a tous ; les
 * effectifs (confirmes, liste d'attente) seulement a qui gere les distributions.
 */
public record RemplissageResponse(
    int placesRestantesBeneficiaires,
    Integer placesRestantesBenevoles,
    Integer beneficiairesConfirmes,
    Integer beneficiairesEnAttente,
    Integer benevolesConfirmes,
    Integer benevolesEnAttente
) {}
