package com.solivio.api.statistique.infrastructure.metriques;

import com.solivio.api.distribution.events.DistributionAnnulee;
import com.solivio.api.distribution.events.DistributionTerminee;
import com.solivio.api.inscription.events.DesistementTardifBenevole;
import com.solivio.api.inscription.events.InscriptionConfirmee;
import com.solivio.api.inscription.events.InscriptionPromue;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Compteurs metier exposes a Prometheus (prefixe solivio_). Comptes apres
 * validation de la transaction, sans aucune donnee personnelle.
 * Un simple ecouteur transactionnel suffit : un compteur perdu lors d'un
 * arret brutal n'a pas besoin du registre de publication.
 */
@Component
public class MetriquesMetier {

    private final Counter inscriptionsConfirmees;
    private final Counter inscriptionsPromues;
    private final Counter desistementsTardifs;
    private final Counter distributionsTerminees;
    private final Counter distributionsAnnulees;

    public MetriquesMetier(MeterRegistry registry) {
        this.inscriptionsConfirmees = Counter.builder("solivio.inscriptions.confirmees")
            .description("Inscriptions confirmees a une distribution")
            .register(registry);
        this.inscriptionsPromues = Counter.builder("solivio.inscriptions.promues")
            .description("Inscriptions promues depuis la liste d'attente")
            .register(registry);
        this.desistementsTardifs = Counter.builder("solivio.desistements.tardifs")
            .description("Desistements de benevoles a moins de 24 heures")
            .register(registry);
        this.distributionsTerminees = Counter.builder("solivio.distributions.terminees")
            .description("Distributions cloturees")
            .register(registry);
        this.distributionsAnnulees = Counter.builder("solivio.distributions.annulees")
            .description("Distributions annulees")
            .register(registry);
    }

    @TransactionalEventListener
    void on(InscriptionConfirmee event) {
        inscriptionsConfirmees.increment();
    }

    @TransactionalEventListener
    void on(InscriptionPromue event) {
        inscriptionsPromues.increment();
    }

    @TransactionalEventListener
    void on(DesistementTardifBenevole event) {
        desistementsTardifs.increment();
    }

    @TransactionalEventListener
    void on(DistributionTerminee event) {
        distributionsTerminees.increment();
    }

    @TransactionalEventListener
    void on(DistributionAnnulee event) {
        distributionsAnnulees.increment();
    }
}
