package com.solivio.api.distribution.infrastructure.kafka;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DistributionEvent(
    String type,
    UUID distributionId,
    LocalDate distributionDate,
    Instant occurredAt
) {}
