package com.solivio.api.inscription.infrastructure.evenements;

import com.solivio.api.distribution.events.DistributionReactivee;
import com.solivio.api.inscription.application.InscriptionService;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Retablit les inscriptions d'une distribution reactivee apres une annulation par erreur.
 */
@Component
public class ReactivationDistributionListener {

    private final InscriptionService inscriptionService;

    public ReactivationDistributionListener(InscriptionService inscriptionService) {
        this.inscriptionService = inscriptionService;
    }

    @ApplicationModuleListener
    void on(DistributionReactivee event) {
        inscriptionService.retablirPourDistribution(event.distributionId());
    }
}
