package com.solivio.api.shared.infrastructure.evenements;

import com.solivio.api.shared.temps.HorlogeAssociation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.CompletedEventPublications;
import org.springframework.modulith.events.FailedEventPublications;
import org.springframework.modulith.events.ResubmissionOptions;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Maintenance du registre des evenements internes (ADR-003) : relance les
 * publications en echec (par exemple un SMTP indisponible) et purge l'archive.
 */
@Component
public class MaintenancePublicationsJob {

    private static final Logger log = LoggerFactory.getLogger(MaintenancePublicationsJob.class);

    // Laisse le temps a une panne passagere de se resorber avant de reessayer.
    static final Duration AGE_MINIMUM_RELANCE = Duration.ofMinutes(5);
    static final Duration CONSERVATION_ARCHIVE = Duration.ofDays(30);
    // Au-dela, la publication reste en echec et l'alerte sur
    // solivio_evenements_publications_echouees prend le relais.
    static final int MAX_TENTATIVES = 5;

    static final ResubmissionOptions OPTIONS_RELANCE = ResubmissionOptions.defaults()
        .withMinAge(AGE_MINIMUM_RELANCE)
        .withFilter(publication -> publication.getCompletionAttempts() < MAX_TENTATIVES);

    private final FailedEventPublications failedPublications;
    private final CompletedEventPublications completedPublications;

    public MaintenancePublicationsJob(FailedEventPublications failedPublications,
                                      CompletedEventPublications completedPublications) {
        this.failedPublications = failedPublications;
        this.completedPublications = completedPublications;
    }

    @Scheduled(fixedDelayString = "PT10M", initialDelayString = "PT2M")
    public void relancerLesEchecs() {
        log.debug("Relance des publications d'evenements en echec");
        failedPublications.resubmit(OPTIONS_RELANCE);
    }

    @Scheduled(cron = "0 30 3 * * *", zone = HorlogeAssociation.FUSEAU_PAR_DEFAUT)
    public void purgerLArchive() {
        completedPublications.deletePublicationsOlderThan(CONSERVATION_ARCHIVE);
    }
}
