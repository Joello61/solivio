package com.solivio.api.shared.infrastructure.evenements;

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
        failedPublications.resubmit(ResubmissionOptions.defaults().withMinAge(AGE_MINIMUM_RELANCE));
    }

    @Scheduled(cron = "0 30 3 * * *", zone = "Europe/Paris")
    public void purgerLArchive() {
        completedPublications.deletePublicationsOlderThan(CONSERVATION_ARCHIVE);
    }
}
