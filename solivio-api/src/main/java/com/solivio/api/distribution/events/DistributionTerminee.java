package com.solivio.api.distribution.events;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Une distribution est terminee : ses statistiques sont calculees.
 */
public record DistributionTerminee(UUID distributionId, LocalDate date) {}
