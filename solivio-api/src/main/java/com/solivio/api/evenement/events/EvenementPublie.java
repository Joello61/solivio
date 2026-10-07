package com.solivio.api.evenement.events;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Un evenement de l'association est publie.
 */
public record EvenementPublie(UUID evenementId, ZonedDateTime dateHeureDebut) {}
