package com.solivio.api.evenement.infrastructure.evenements;

import com.solivio.api.evenement.events.EvenementAnnule;
import com.solivio.api.evenement.events.EvenementPublie;
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
public class EvenementEventPublisher {

    private final ApplicationEventPublisher events;

    public EvenementEventPublisher(ApplicationEventPublisher events) {
        this.events = events;
    }

    public void publierPublie(UUID evenementId, ZonedDateTime dateHeureDebut) {
        events.publishEvent(new EvenementPublie(evenementId, dateHeureDebut));
    }

    public void publierAnnule(UUID evenementId, ZonedDateTime dateHeureDebut) {
        events.publishEvent(new EvenementAnnule(evenementId, dateHeureDebut));
    }
}
