package com.solivio.api.collecte.infrastructure.evenements;

import com.solivio.api.collecte.events.MissionCollecteAnnulee;
import com.solivio.api.collecte.events.MissionCollecteCreee;
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
public class CollecteEventPublisher {

    private final ApplicationEventPublisher events;

    public CollecteEventPublisher(ApplicationEventPublisher events) {
        this.events = events;
    }

    public void publierCreee(UUID missionId, ZonedDateTime dateHeure) {
        events.publishEvent(new MissionCollecteCreee(missionId, dateHeure));
    }

    public void publierAnnulee(UUID missionId, ZonedDateTime dateHeure, UUID benevoleId) {
        events.publishEvent(new MissionCollecteAnnulee(missionId, dateHeure, benevoleId));
    }
}
