package com.solivio.api.inscription.infrastructure.evenements;

import com.solivio.api.identity.events.PersonneEffacee;
import com.solivio.api.inscription.application.InscriptionService;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/** Anonymise les copies de nom des inscriptions d'une personne effacee (RGPD). */
@Component
public class PersonneEffaceeListener {

    private final InscriptionService inscriptionService;

    public PersonneEffaceeListener(InscriptionService inscriptionService) {
        this.inscriptionService = inscriptionService;
    }

    @ApplicationModuleListener
    void on(PersonneEffacee event) {
        inscriptionService.anonymiserPersonne(event.personneId());
    }
}
