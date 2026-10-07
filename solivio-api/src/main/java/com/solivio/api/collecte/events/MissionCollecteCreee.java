package com.solivio.api.collecte.events;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Une mission de collecte est creee.
 */
public record MissionCollecteCreee(UUID missionId, ZonedDateTime dateHeure) {}
