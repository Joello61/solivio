package com.solivio.api.inscription.infrastructure.kafka;

import java.time.Instant;
import java.util.UUID;

public record InscriptionEvent(
    String type,
    UUID inscriptionId,
    UUID distributionId,
    UUID personneId,
    String tenantSlug,
    Instant occurredAt
) {}
