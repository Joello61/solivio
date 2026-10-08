package com.solivio.api.reconditionnement.infrastructure.evenements;

import com.solivio.api.reconditionnement.events.SessionReconditionnementAnnulee;
import java.time.ZonedDateTime;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * Publie les evenements du module. Appele depuis une transaction : Spring
 * Modulith enregistre l'evenement avec la donnee metier et le transmet aux
 * ecouteurs apres validation (ADR-003).
 */
@Component
public class ReconditionnementEventPublisher {

    private final ApplicationEventPublisher events;

    public ReconditionnementEventPublisher(ApplicationEventPublisher events) {
        this.events = events;
    }

    public void publierAnnulee(UUID sessionId, ZonedDateTime dateHeureDebut) {
        events.publishEvent(new SessionReconditionnementAnnulee(sessionId, dateHeureDebut));
    }
}
