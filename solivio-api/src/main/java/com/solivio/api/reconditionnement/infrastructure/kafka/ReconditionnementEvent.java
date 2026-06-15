package com.solivio.api.reconditionnement.infrastructure.kafka;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.UUID;

public record ReconditionnementEvent(
    String type,
    UUID sessionId,
    String tenantSlug,
    ZonedDateTime dateHeureDebut,
    Instant occurredAt
) {}
