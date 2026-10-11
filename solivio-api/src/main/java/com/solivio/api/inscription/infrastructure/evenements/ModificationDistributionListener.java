package com.solivio.api.inscription.infrastructure.evenements;

import com.solivio.api.distribution.events.DistributionModifiee;
import com.solivio.api.inscription.application.InscriptionService;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/** Des places se sont ouvertes sur une distribution modifiee : la liste d'attente avance (RG3). */
@Component
public class ModificationDistributionListener {

    private final InscriptionService inscriptionService;

    public ModificationDistributionListener(InscriptionService inscriptionService) {
        this.inscriptionService = inscriptionService;
    }

    @ApplicationModuleListener
    void on(DistributionModifiee event) {
        if (event.capaciteAugmentee()) {
            inscriptionService.promouvoirSelonPlaces(event.distributionId());
        }
    }
}
