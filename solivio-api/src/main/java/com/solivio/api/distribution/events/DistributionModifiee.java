package com.solivio.api.distribution.events;

import java.util.UUID;

/**
 * Une distribution publiee a ete modifiee. changementPratique : date, lieu ou
 * horaires d'un creneau changes, les inscrits sont prevenus. capaciteAugmentee :
 * des places se sont ouvertes, la liste d'attente est promue. occurrenceId est
 * propre a chaque modification et sert de cle d'idempotence aux notifications.
 */
public record DistributionModifiee(
    UUID distributionId,
    boolean changementPratique,
    boolean capaciteAugmentee,
    UUID occurrenceId
) {}
