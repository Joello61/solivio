package com.solivio.api.notification.infrastructure.kafka;

import com.solivio.api.notification.application.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class RappelNotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(RappelNotificationConsumer.class);

    private final NotificationService notificationService;

    public RappelNotificationConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "rappels", groupId = "notifications-rappels")
    public void traiter(RappelEvent event) {
        if (!"rappel.veille".equals(event.type())) {
            return;
        }
        log.debug("Traitement rappel veille distribution {}", event.distributionId());
        notificationService.notifierRappelVeille(event.distributionId());
    }
}
