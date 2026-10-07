package com.solivio.api.reconditionnement.infrastructure.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.UUID;

@Service
public class ReconditionnementEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(ReconditionnementEventPublisher.class);
    private static final String TOPIC = "reconditionnement";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public ReconditionnementEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publierPubliee(UUID sessionId, ZonedDateTime dateHeureDebut) {
        emettreEvenement("reconditionnement.publie", sessionId, dateHeureDebut);
    }

    public void publierAnnulee(UUID sessionId, ZonedDateTime dateHeureDebut) {
        emettreEvenement("reconditionnement.annule", sessionId, dateHeureDebut);
    }

    private void emettreEvenement(
        String type, UUID sessionId, ZonedDateTime dateHeureDebut
    ) {
        ReconditionnementEvent event = new ReconditionnementEvent(
            type, sessionId, dateHeureDebut, Instant.now());
        kafkaTemplate.send(TOPIC, sessionId.toString(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Echec emission evenement {} pour session {}", type, sessionId, ex);
                } else {
                    log.debug("Evenement {} emis pour session {}", type, sessionId);
                }
            });
    }
}
