package com.solivio.api.notification.infrastructure.kafka;

import java.time.Instant;
import java.util.UUID;

public record RappelEvent(
    String type,
    UUID distributionId,
    String tenantSlug,
    Instant occurredAt
) {}
