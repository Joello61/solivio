package com.solivio.api.evenement.infrastructure.kafka;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.UUID;

public record EvenementEvent(
    String type,
    UUID evenementId,
    String tenantSlug,
    ZonedDateTime dateHeureDebut,
    Instant occurredAt
) {}
