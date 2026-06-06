package com.solivio.api.distribution.infrastructure.kafka;

import java.time.Instant;
import java.util.UUID;

public record DistributionEvent(
    String type,
    UUID distributionId,
    String tenantSlug,
    Instant occurredAt
) {}
