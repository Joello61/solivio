package com.solivio.api.statistique.infrastructure.kafka;

import com.solivio.api.association.multitenancy.TenantContext;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.distribution.infrastructure.kafka.DistributionEvent;
import com.solivio.api.statistique.application.StatistiqueService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class DistributionTermineeStatistiqueConsumer {

    private static final Logger log = LoggerFactory.getLogger(
        DistributionTermineeStatistiqueConsumer.class
    );

    private final StatistiqueService statistiqueService;

    public DistributionTermineeStatistiqueConsumer(StatistiqueService statistiqueService) {
        this.statistiqueService = statistiqueService;
    }

    @KafkaListener(topics = "distributions", groupId = "statistiques-distributions")
    public void traiter(DistributionEvent event) {
        if (!"distribution.terminee".equals(event.type())) {
            return;
        }
        log.debug("Calcul des stats pour distribution terminee {}", event.distributionId());
        TenantContext.setTenantId(TenantProvisioningService.schemaName(event.tenantSlug()));
        try {
            statistiqueService.calculerEtSauvegarder(event.distributionId(), event.distributionDate());
        } finally {
            TenantContext.clear();
        }
    }
}
