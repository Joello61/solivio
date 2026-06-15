package com.solivio.api.notification.infrastructure.kafka;

import com.solivio.api.association.multitenancy.TenantContext;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.notification.application.NotificationService;
import com.solivio.api.reconditionnement.infrastructure.kafka.ReconditionnementEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class ReconditionnementNotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(ReconditionnementNotificationConsumer.class);

    private final NotificationService notificationService;

    public ReconditionnementNotificationConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "reconditionnement", groupId = "notifications-reconditionnement")
    public void traiter(ReconditionnementEvent event) {
        if (!"reconditionnement.annule".equals(event.type())) {
            return;
        }
        log.debug("Traitement notification annulation session {}", event.sessionId());
        TenantContext.setTenantId(TenantProvisioningService.schemaName(event.tenantSlug()));
        try {
            notificationService.notifierAnnulationSessionReconditionnement(event.sessionId());
        } finally {
            TenantContext.clear();
        }
    }
}
