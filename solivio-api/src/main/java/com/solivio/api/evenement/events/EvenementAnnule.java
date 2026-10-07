package com.solivio.api.evenement.events;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Un evenement publie est annule.
 */
public record EvenementAnnule(UUID evenementId, ZonedDateTime dateHeureDebut) {}
