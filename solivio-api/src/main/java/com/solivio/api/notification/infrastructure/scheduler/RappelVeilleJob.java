package com.solivio.api.notification.infrastructure.scheduler;

import com.solivio.api.notification.infrastructure.evenements.RappelEventPublisher;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.temps.HorlogeAssociation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Component
public class RappelVeilleJob {

    private static final Logger log = LoggerFactory.getLogger(RappelVeilleJob.class);

    private final DistributionQueryPort distributionQueryPort;
    private final RappelEventPublisher rappelEventPublisher;
    private final HorlogeAssociation horloge;

    public RappelVeilleJob(
        DistributionQueryPort distributionQueryPort,
        RappelEventPublisher rappelEventPublisher,
        HorlogeAssociation horloge
    ) {
        this.distributionQueryPort = distributionQueryPort;
        this.rappelEventPublisher = rappelEventPublisher;
        this.horloge = horloge;
    }

    /**
     * Declenche chaque matin a 8h (heure de Paris) et emet un rappel pour
     * chaque distribution publiee du lendemain.
     */
    // Le conteneur tourne en UTC : fuseau explicite pour le cron, et "demain" dans
    // le fuseau de l'association.
    @Scheduled(cron = "0 0 8 * * *", zone = HorlogeAssociation.FUSEAU_PAR_DEFAUT)
    @Transactional
    public void emettreRappelsVeille() {
        LocalDate demain = horloge.aujourdhui().plusDays(1);
        log.info("Job rappel veille : recherche des distributions pour le {}", demain);
        emettreRappels(demain);
    }

    // Transactionnel : le registre d'evenements n'enregistre une publication
    // que dans une transaction, et l'envoi n'a lieu qu'apres sa validation.
    @Transactional
    public void emettreRappels(LocalDate date) {
        List<UUID> distributionIds = distributionQueryPort.trouverDistributionsPublieesPourDate(date);
        for (UUID distId : distributionIds) {
            rappelEventPublisher.publierRappelVeille(distId);
            log.debug("Rappel veille emis pour distribution {}", distId);
        }
    }
}
