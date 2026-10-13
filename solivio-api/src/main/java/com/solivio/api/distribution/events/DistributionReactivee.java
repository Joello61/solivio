package com.solivio.api.distribution.events;

import java.util.UUID;

/**
 * Une distribution annulee par erreur est de nouveau publiee : les inscriptions que
 * l'annulation avait supprimees sont retablies.
 */
public record DistributionReactivee(UUID distributionId, UUID occurrenceId) {}
