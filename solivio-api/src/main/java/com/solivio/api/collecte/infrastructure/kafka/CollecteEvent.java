package com.solivio.api.collecte.infrastructure.kafka;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.UUID;

public record CollecteEvent(
    String type,
    UUID missionId,
    ZonedDateTime dateHeure,
    UUID benevoleId,
    Instant occurredAt
) {}
