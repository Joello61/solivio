package com.solivio.api.collecte.infrastructure.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.UUID;

@Service
public class CollecteEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(CollecteEventPublisher.class);
    private static final String TOPIC = "mission-collecte";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public CollecteEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publierCreee(UUID missionId, ZonedDateTime dateHeure) {
        emettreEvenement("mission-collecte.creee", missionId, dateHeure, null);
    }

    public void publierAnnulee(UUID missionId, ZonedDateTime dateHeure, UUID benevoleId) {
        emettreEvenement("mission-collecte.annulee", missionId, dateHeure, benevoleId);
    }

    private void emettreEvenement(
        String type, UUID missionId, ZonedDateTime dateHeure, UUID benevoleId
    ) {
        CollecteEvent event = new CollecteEvent(
            type, missionId, dateHeure, benevoleId, Instant.now());
        kafkaTemplate.send(TOPIC, missionId.toString(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Echec emission evenement {} pour mission {}", type, missionId, ex);
                } else {
                    log.debug("Evenement {} emis pour mission {}", type, missionId);
                }
            });
    }
}
