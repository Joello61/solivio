package com.solivio.api.collecte.events;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Une mission de collecte est annulee ; benevoleId est nul si personne ne l'avait prise.
 */
public record MissionCollecteAnnulee(UUID missionId, ZonedDateTime dateHeure, UUID benevoleId) {}
