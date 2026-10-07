package com.solivio.api.notification.infrastructure.kafka;

import com.solivio.api.collecte.infrastructure.kafka.CollecteEvent;
import com.solivio.api.notification.application.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class CollecteNotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(CollecteNotificationConsumer.class);

    private final NotificationService notificationService;

    public CollecteNotificationConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "mission-collecte", groupId = "notifications-collecte")
    public void traiter(CollecteEvent event) {
        log.debug("Traitement notification collecte {} pour mission {}", event.type(), event.missionId());
        if ("mission-collecte.creee".equals(event.type())) {
            notificationService.notifierCreationMissionCollecte(event.missionId());
        } else if ("mission-collecte.annulee".equals(event.type())) {
            notificationService.notifierAnnulationMissionCollecte(event.missionId(), event.benevoleId());
        }
    }
}
