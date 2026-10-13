package com.solivio.api.inscription.infrastructure.evenements;

import com.solivio.api.distribution.events.DistributionTerminee;
import com.solivio.api.inscription.application.InscriptionService;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Enregistre les absences a la cloture d'une distribution (RG4), puis laisse les
 * statistiques se calculer sur l'etat final.
 */
@Component
public class ClotureDistributionListener {

    private final InscriptionService inscriptionService;

    public ClotureDistributionListener(InscriptionService inscriptionService) {
        this.inscriptionService = inscriptionService;
    }

    @ApplicationModuleListener
    void on(DistributionTerminee event) {
        inscriptionService.enregistrerAbsences(event.distributionId(), event.date());
    }
}
