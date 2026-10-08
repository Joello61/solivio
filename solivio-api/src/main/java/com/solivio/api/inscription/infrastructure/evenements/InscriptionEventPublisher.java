package com.solivio.api.inscription.infrastructure.evenements;

import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.events.DesistementTardifBenevole;
import com.solivio.api.inscription.events.InscriptionConfirmee;
import com.solivio.api.inscription.events.InscriptionPromue;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * Publie les evenements du module. Appele depuis une transaction : Spring
 * Modulith enregistre l'evenement avec la donnee metier et le transmet aux
 * ecouteurs apres validation (ADR-003).
 */
@Component
public class InscriptionEventPublisher {

    private final ApplicationEventPublisher events;

    public InscriptionEventPublisher(ApplicationEventPublisher events) {
        this.events = events;
    }

    public void publierConfirmee(Inscription inscription) {
        events.publishEvent(new InscriptionConfirmee(inscription.getId(), inscription.getDistributionId(),
            inscription.getPersonneId(), inscription.getType().name(), inscription.getCreneauId()));
    }

    public void publierPromue(Inscription inscription) {
        events.publishEvent(new InscriptionPromue(inscription.getId(), inscription.getDistributionId(),
            inscription.getPersonneId(), inscription.getType().name(), inscription.getCreneauId()));
    }

    public void publierDesistementTardifBenevole(Inscription inscription) {
        events.publishEvent(new DesistementTardifBenevole(inscription.getId(),
            inscription.getDistributionId(), inscription.getPersonneId()));
    }
}
