package com.solivio.api.notification.infrastructure.kafka;

import com.solivio.api.association.multitenancy.TenantContext;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.inscription.infrastructure.kafka.InscriptionEvent;
import com.solivio.api.notification.application.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class InscriptionNotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(InscriptionNotificationConsumer.class);

    private final NotificationService notificationService;

    public InscriptionNotificationConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "inscriptions", groupId = "notifications-inscriptions")
    public void traiter(InscriptionEvent event) {
        if (!"inscription.confirmee".equals(event.type())
            && !"inscription.promue".equals(event.type())) {
            return;
        }
        log.debug("Traitement notification pour evenement {} inscription {}",
            event.type(), event.inscriptionId());
        TenantContext.setTenantId(TenantProvisioningService.schemaName(event.tenantSlug()));
        try {
            if ("inscription.confirmee".equals(event.type())) {
                notificationService.notifierConfirmationInscription(
                    event.personneId(), event.distributionId(),
                    event.typeInscription(), event.creneauId());
            } else {
                notificationService.notifierPromotionListeAttente(
                    event.personneId(), event.distributionId(),
                    event.typeInscription(), event.creneauId());
            }
        } finally {
            TenantContext.clear();
        }
    }
}
