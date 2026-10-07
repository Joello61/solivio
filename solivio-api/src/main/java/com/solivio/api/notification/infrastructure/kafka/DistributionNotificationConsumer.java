package com.solivio.api.notification.infrastructure.kafka;

import com.solivio.api.distribution.infrastructure.kafka.DistributionEvent;
import com.solivio.api.notification.application.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class DistributionNotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(DistributionNotificationConsumer.class);

    private final NotificationService notificationService;

    public DistributionNotificationConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "distributions", groupId = "notifications-distributions")
    public void traiter(DistributionEvent event) {
        if (!"distribution.annulee".equals(event.type())) {
            return;
        }
        log.debug("Traitement notification annulation distribution {}", event.distributionId());
        notificationService.notifierAnnulationDistribution(event.distributionId());
    }
}
