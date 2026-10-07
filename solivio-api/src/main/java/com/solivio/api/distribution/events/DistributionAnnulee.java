package com.solivio.api.distribution.events;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Une distribution publiee est annulee : les inscrits sont prevenus.
 */
public record DistributionAnnulee(UUID distributionId, LocalDate date) {}
