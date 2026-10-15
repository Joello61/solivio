package com.solivio.api.inscription.infrastructure.web.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
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
    String distributionLieuNom,
    // Une distribution terminee ou annulee le jour meme n'est plus "a venir".
    String distributionStatut,
    // Horaire du rendez-vous : celui du creneau choisi, sinon la plage de la distribution.
    LocalTime heureDebut,
    LocalTime heureFin,
    String type,
    String statut,
    Integer rangListeAttente,
    String presence,
    boolean absenceDeduite,
    Instant dateInscription
) {}
