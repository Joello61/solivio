package com.solivio.api.notification.infrastructure.scheduler;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.multitenancy.TenantContext;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.notification.infrastructure.kafka.RappelEventPublisher;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Component
public class RappelVeilleJob {

    private static final Logger log = LoggerFactory.getLogger(RappelVeilleJob.class);

    private final AssociationRepository associationRepository;
    private final DistributionQueryPort distributionQueryPort;
    private final RappelEventPublisher rappelEventPublisher;

    public RappelVeilleJob(
        AssociationRepository associationRepository,
        DistributionQueryPort distributionQueryPort,
        RappelEventPublisher rappelEventPublisher
    ) {
        this.associationRepository = associationRepository;
        this.distributionQueryPort = distributionQueryPort;
        this.rappelEventPublisher = rappelEventPublisher;
    }

    /**
     * Declenche chaque matin a 8h. Pour chaque association active,
     * emet un evenement rappel.veille pour chaque distribution du lendemain.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void emettreRappelsVeille() {
        LocalDate demain = LocalDate.now().plusDays(1);
        log.info("Job rappel veille : recherche des distributions pour le {}", demain);

        List<Association> associations = associationRepository.findAllByStatut("active");
        for (Association association : associations) {
            emettreRappelsPourAssociation(association.getSlug(), demain);
        }
    }

    void emettreRappelsPourAssociation(String tenantSlug, LocalDate date) {
        TenantContext.setTenantId(TenantProvisioningService.schemaName(tenantSlug));
        try {
            List<UUID> distributionIds = distributionQueryPort.trouverDistributionsPublieesPourDate(date);
            for (UUID distId : distributionIds) {
                rappelEventPublisher.publierRappelVeille(distId, tenantSlug);
                log.debug("Rappel veille emis pour distribution {} (tenant {})", distId, tenantSlug);
            }
        } finally {
            TenantContext.clear();
        }
    }
}
