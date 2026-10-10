package com.solivio.api.inscription.infrastructure.evenements;

import com.solivio.api.distribution.events.DistributionAnnulee;
import com.solivio.api.inscription.application.InscriptionService;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Annule les inscriptions d'une distribution annulee. Sans cela, elles restaient
 * confirmees et comptaient dans la limite de frequence (RG1) des beneficiaires.
 */
@Component
public class AnnulationDistributionListener {

    private final InscriptionService inscriptionService;

    public AnnulationDistributionListener(InscriptionService inscriptionService) {
        this.inscriptionService = inscriptionService;
    }

    @ApplicationModuleListener
    void on(DistributionAnnulee event) {
        inscriptionService.annulerToutesPourDistribution(event.distributionId());
    }
}
