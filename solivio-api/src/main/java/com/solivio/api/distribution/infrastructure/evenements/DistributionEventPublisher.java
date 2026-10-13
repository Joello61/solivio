package com.solivio.api.distribution.infrastructure.evenements;

import com.solivio.api.distribution.events.DistributionAnnulee;
import com.solivio.api.distribution.events.DistributionModifiee;
import com.solivio.api.distribution.events.DistributionReactivee;
import com.solivio.api.distribution.events.DistributionTerminee;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Publie les evenements du module. Appele depuis une transaction : Spring
 * Modulith enregistre l'evenement avec la donnee metier et le transmet aux
 * ecouteurs apres validation (ADR-003).
 */
@Component
public class DistributionEventPublisher {

    private final ApplicationEventPublisher events;

    public DistributionEventPublisher(ApplicationEventPublisher events) {
        this.events = events;
    }

    public void publierAnnulee(UUID distributionId, LocalDate date) {
        events.publishEvent(new DistributionAnnulee(distributionId, date));
    }

    public void publierReactivee(UUID distributionId) {
        events.publishEvent(new DistributionReactivee(distributionId, UUID.randomUUID()));
    }

    public void publierModifiee(UUID distributionId, boolean changementPratique, boolean capaciteAugmentee) {
        events.publishEvent(new DistributionModifiee(
            distributionId, changementPratique, capaciteAugmentee, UUID.randomUUID()));
    }

    public void publierTerminee(UUID distributionId, LocalDate date) {
        events.publishEvent(new DistributionTerminee(distributionId, date));
    }
}
