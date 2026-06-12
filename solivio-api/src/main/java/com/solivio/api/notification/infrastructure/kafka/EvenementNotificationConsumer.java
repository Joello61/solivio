package com.solivio.api.notification.infrastructure.kafka;

import com.solivio.api.association.multitenancy.TenantContext;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.evenement.infrastructure.kafka.EvenementEvent;
import com.solivio.api.notification.application.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class EvenementNotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(EvenementNotificationConsumer.class);

    private final NotificationService notificationService;

    public EvenementNotificationConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "evenement", groupId = "notifications-evenement")
    public void traiter(EvenementEvent event) {
        log.debug("Traitement notification evenement {} pour {}", event.type(), event.evenementId());
        TenantContext.setTenantId(TenantProvisioningService.schemaName(event.tenantSlug()));
        try {
            if ("evenement.publie".equals(event.type())) {
                notificationService.notifierPublicationEvenement(event.evenementId());
            } else if ("evenement.annule".equals(event.type())) {
                notificationService.notifierAnnulationEvenement(event.evenementId(), event.tenantSlug());
            }
        } finally {
            TenantContext.clear();
        }
    }
}
