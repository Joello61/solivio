package com.solivio.api.notification.infrastructure.scheduler;

import com.solivio.api.notification.infrastructure.evenements.RappelEventPublisher;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Component
public class RappelVeilleJob {

    private static final Logger log = LoggerFactory.getLogger(RappelVeilleJob.class);

    // Les distributions et l'association vivent en heure de Paris ; le conteneur
    // tourne souvent en UTC, d'ou un fuseau explicite pour le cron et pour "demain".
    static final String FUSEAU = "Europe/Paris";

    private final DistributionQueryPort distributionQueryPort;
    private final RappelEventPublisher rappelEventPublisher;

    public RappelVeilleJob(
        DistributionQueryPort distributionQueryPort,
        RappelEventPublisher rappelEventPublisher
    ) {
        this.distributionQueryPort = distributionQueryPort;
        this.rappelEventPublisher = rappelEventPublisher;
    }

    /**
     * Declenche chaque matin a 8h (heure de Paris) et emet un rappel pour
     * chaque distribution publiee du lendemain.
     */
    @Scheduled(cron = "0 0 8 * * *", zone = FUSEAU)
    @Transactional
    public void emettreRappelsVeille() {
        LocalDate demain = LocalDate.now(ZoneId.of(FUSEAU)).plusDays(1);
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
